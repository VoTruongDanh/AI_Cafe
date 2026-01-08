import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Paper,
  Divider,
  Grid,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  IconButton,
} from '@mui/material';
import {
  CameraAlt as CameraIcon,
  Stop as StopIcon,
  Person as PersonIcon,
  CheckCircle as SuccessIcon,
  Cancel as FailIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Star as StarIcon,
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  PhotoCamera as PhotoCameraIcon,
  ShoppingBag as ShoppingBagIcon,
  Thermostat as ThermostatIcon,
  LocalFireDepartment as FireIcon,
  AcUnit as ColdIcon,
  LocationOn as LocationIcon,
  Favorite as FavoriteIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import { ADMIN_COLORS } from '../../constants/adminTheme';
import { faceRecognitionApi, adminUsersApi } from '../../services/api';
import api from '../../services/api';
import { toast } from 'react-toastify';

const SCAN_INTERVAL = 3500; // Quét mỗi 3.5 giây (tối ưu tốc độ)
const MAX_SCANS_BEFORE_NEW_CUSTOMER = 3; // Sau 3 lần quét không tìm thấy -> hiện khách mới

const FaceRecognition = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState(null);
  const [scanCount, setScanCount] = useState(0);
  const [noMatchCount, setNoMatchCount] = useState(0); // Đếm số lần không tìm thấy
  const [isNewCustomer, setIsNewCustomer] = useState(false); // Flag khách hàng mới
  const [capturedImage, setCapturedImage] = useState(null); // Ảnh đã chụp cho khách mới
  const [lastScanTime, setLastScanTime] = useState(null);
  const [error, setError] = useState(null);
  
  // Dialog tạo tài khoản mới
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '12345678', // Mật khẩu mặc định (8 ký tự)
  });
  const [isCreating, setIsCreating] = useState(false);

  // AI Suggestions state (từ trang /AI)
  const [temperature, setTemperature] = useState('32');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [useLocation, setUseLocation] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationInfo, setLocationInfo] = useState(null);
  const [minConfidence, setMinConfidence] = useState(0.6);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // Kiểm tra trạng thái AI Service
  const { data: statusData, isLoading: isCheckingStatus } = useQuery({
    queryKey: ['face-recognition-status'],
    queryFn: async () => {
      const response = await faceRecognitionApi.checkStatus();
      return response.data;
    },
    staleTime: 60 * 1000,
  });

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  // Bắt đầu camera và quét realtime
  const startScanning = useCallback(async () => {
    try {
      setError(null);
      setRecognitionResult(null);
      setScanCount(0);
      setNoMatchCount(0);
      setIsNewCustomer(false);
      setCapturedImage(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user', 
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Không thể truy cập camera. Vui lòng cho phép quyền truy cập camera.');
    }
  }, []);

  // Gắn stream vào video và bắt đầu quét khi camera mở
  useEffect(() => {
    if (isCameraOpen && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(e => console.log('Video play error:', e));
      
      // Bắt đầu quét sau 1 giây (đợi video ổn định)
      const startDelay = setTimeout(() => {
        setIsScanning(true);
        startRealtimeScan();
      }, 1000);
      
      return () => clearTimeout(startDelay);
    }
  }, [isCameraOpen]);

  // Realtime scanning loop
  const startRealtimeScan = useCallback(() => {
    // Clear interval cũ nếu có
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    // Quét ngay lập tức
    performScan();

    // Sau đó quét định kỳ
    scanIntervalRef.current = setInterval(() => {
      performScan();
    }, SCAN_INTERVAL);
  }, []);

  // Thực hiện 1 lần quét
  const performScan = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Chụp frame từ video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    setScanCount(prev => prev + 1);
    setLastScanTime(new Date());

    try {
      const response = await faceRecognitionApi.recognize(imageData);
      const result = response.data;

      if (result.matched) {
        // Tìm thấy khách hàng - dừng quét
        setRecognitionResult(result);
        setIsScanning(false);
        setNoMatchCount(0);
        setIsNewCustomer(false);
        if (scanIntervalRef.current) {
          clearInterval(scanIntervalRef.current);
          scanIntervalRef.current = null;
        }
      } else {
        // Chưa tìm thấy - tăng đếm
        setNoMatchCount(prev => {
          const newCount = prev + 1;
          // Sau MAX_SCANS_BEFORE_NEW_CUSTOMER lần không tìm thấy -> hiện khách mới
          if (newCount >= MAX_SCANS_BEFORE_NEW_CUSTOMER) {
            setIsNewCustomer(true);
            setCapturedImage(imageData); // Lưu ảnh đã chụp
            setIsScanning(false);
            if (scanIntervalRef.current) {
              clearInterval(scanIntervalRef.current);
              scanIntervalRef.current = null;
            }
          }
          return newCount;
        });
        setRecognitionResult(null);
      }
    } catch (err) {
      console.error('Scan error:', err);
      // Không dừng quét khi có lỗi, chỉ log
    }
  };

  // Dừng quét và tắt camera
  const stopScanning = useCallback(() => {
    // Dừng interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    // Dừng camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsCameraOpen(false);
    setIsScanning(false);
  }, []);

  // Reset và quét lại
  const resetAndScan = useCallback(() => {
    setRecognitionResult(null);
    setScanCount(0);
    setNoMatchCount(0);
    setIsNewCustomer(false);
    setCapturedImage(null);
    setIsScanning(true);
    startRealtimeScan();
  }, [startRealtimeScan]);

  // Mở dialog tạo tài khoản
  const handleOpenCreateDialog = () => {
    setError(null);
    setShowCreateDialog(true);
    setNewCustomerData({
      name: '',
      email: '',
      phone: '',
      password: '12345678',
    });
  };

  // Tạo tài khoản mới với ảnh đã chụp
  const handleCreateCustomer = async () => {
    if (!newCustomerData.name || !newCustomerData.email) {
      setError('Vui lòng nhập tên và email');
      return;
    }

    setIsCreating(true);
    try {
      // 1. Tạo tài khoản mới
      const createResponse = await adminUsersApi.create({
        name: newCustomerData.name,
        email: newCustomerData.email,
        phone: newCustomerData.phone,
        password: newCustomerData.password,
        role: 'customer',
      });

      const newUser = createResponse.data?.data || createResponse.data;

      // 2. Upload avatar nếu có ảnh đã chụp
      if (capturedImage && newUser?.id) {
        await adminUsersApi.uploadAvatar(newUser.id, { avatar_base64: capturedImage });
      }

      // Thành công
      setShowCreateDialog(false);
      setRecognitionResult({
        matched: true,
        confidence: 100,
        customer: {
          ...newUser,
          loyalty_tier: 'bronze',
          loyalty_points: 0,
        },
        isNewlyCreated: true,
      });
      setIsNewCustomer(false);
      
      // Invalidate cache
      queryClient.invalidateQueries(['admin-users']);
      
    } catch (err) {
      console.error('Error creating customer:', err);
      setError(err.response?.data?.message || 'Không thể tạo tài khoản. Vui lòng thử lại.');
    } finally {
      setIsCreating(false);
    }
  };

  // Chụp lại ảnh
  const retakePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    setCapturedImage(canvas.toDataURL('image/jpeg', 0.8));
  };

  // Helper để tạo URL cho static files
  const getStaticFileUrl = useCallback((path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    if (path.startsWith('data:')) return path;
    const backendUrl = import.meta.env.DEV 
      ? 'http://127.0.0.1:8000'
      : (import.meta.env.VITE_API_URL?.replace('/api', '') || '');
    return `${backendUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  }, []);

  // Fetch AI suggestions theo nhiệt độ
  const fetchSuggestions = useCallback(async (tempValue) => {
    if (!tempValue || tempValue === '') {
      return;
    }

    const parsedTemp = parseFloat(tempValue);
    if (isNaN(parsedTemp)) {
      return;
    }

    setSuggestionsLoading(true);
    try {
      const tempType = parsedTemp >= 30 ? 'COLD' : 'HOT';
      const response = await api.get('/products/suggest-by-temperature', {
        params: {
          temperature: tempType,
          limit: 12,
          min_confidence: minConfidence,
        },
      });

      if (response.data.success) {
        setSuggestions(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    } finally {
      setSuggestionsLoading(false);
    }
  }, [minConfidence]);

  // Fetch temperature từ location
  const fetchTemperatureFromLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error('Trình duyệt không hỗ trợ lấy vị trí');
      setUseLocation(false);
      return;
    }

    setLocationLoading(true);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      });

      const { latitude, longitude } = position.coords;
      const response = await api.get('/weather/temperature', {
        params: { lat: latitude, lon: longitude },
      });

      if (response.data.success) {
        const temp = response.data.temperature;
        setTemperature(temp.toString());
        setLocationInfo({
          city: response.data.city,
          country: response.data.country,
          description: response.data.description,
        });
      }
    } catch (err) {
      console.error('Error fetching temperature from location:', err);
      // Fallback to default location
      try {
        const defaultResponse = await api.get('/weather/temperature');
        if (defaultResponse.data.success) {
          const temp = defaultResponse.data.temperature;
          setTemperature(temp.toString());
          setLocationInfo({
            city: defaultResponse.data.city || 'TP.HCM',
            country: defaultResponse.data.country || 'Vietnam',
          });
        }
      } catch (fallbackErr) {
        console.warn('Default location also failed:', fallbackErr);
      }
      setUseLocation(false);
    } finally {
      setLocationLoading(false);
    }
  }, []);

  // Auto fetch temperature when useLocation is enabled
  useEffect(() => {
    if (useLocation) {
      fetchTemperatureFromLocation();
    }
  }, [useLocation, fetchTemperatureFromLocation]);

  // Auto fetch suggestions when temperature changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (temperature && !locationLoading) {
        fetchSuggestions(temperature);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [temperature, minConfidence, locationLoading, fetchSuggestions]);

  const isAIReady = statusData?.ai_service === 'online' && statusData?.deepface_ready;

  return (
    <AdminPageLayout
      title="Nhận diện khách hàng"
      subtitle="Tự động nhận diện khách hàng realtime từ camera"
    >
      {/* Status Alert */}
      {isCheckingStatus ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          <CircularProgress size={16} sx={{ mr: 1 }} />
          Đang kiểm tra trạng thái AI Service...
        </Alert>
      ) : !isAIReady ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <strong>AI Service chưa sẵn sàng!</strong>
          <br />
          {!statusData?.deepface_ready && (
            <>
              DeepFace chưa được cài đặt. Vui lòng chạy:
              <code style={{ display: 'block', marginTop: 8, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                cd Backend/ai-temp-local<br />
                pip install deepface tensorflow tf-keras
              </code>
            </>
          )}
        </Alert>
      ) : (
        <Alert severity="success" sx={{ mb: 3 }}>
          AI Service đang hoạt động. Sẵn sàng nhận diện realtime!
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Camera Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CameraIcon /> Camera
                </Typography>
                {isScanning && (
                  <Chip 
                    icon={<SearchIcon />} 
                    label="Đang quét..." 
                    color="primary" 
                    size="small"
                    sx={{ animation: 'pulse 1.5s infinite' }}
                  />
                )}
              </Box>

              {/* Scanning progress */}
              {isScanning && (
                <Box sx={{ mb: 1 }}>
                  <LinearProgress color="primary" />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Đã quét {scanCount} lần | Quét mỗi {SCAN_INTERVAL / 1000}s
                  </Typography>
                </Box>
              )}

              <Box
                sx={{
                  width: '100%',
                  aspectRatio: '4/3',
                  bgcolor: '#1a1a1a',
                  borderRadius: 2,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                  position: 'relative',
                  border: isScanning ? '3px solid' : 'none',
                  borderColor: isScanning ? 'primary.main' : 'transparent',
                }}
              >
                {!isCameraOpen && (
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <CameraIcon sx={{ fontSize: 60, color: 'grey.600', mb: 1 }} />
                    <Typography color="white">
                      Nhấn &quot;Bắt đầu quét&quot; để nhận diện realtime
                    </Typography>
                  </Box>
                )}

                {isCameraOpen && (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: 'scaleX(-1)',
                      }}
                    />
                    
                    {/* Face guide frame - Khung hướng dẫn vị trí khuôn mặt */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '45%',
                        height: '60%',
                        border: '3px solid',
                        borderColor: isScanning 
                          ? (recognitionResult?.matched ? 'success.main' : 'primary.main')
                          : 'grey.400',
                        borderRadius: '50%',
                        pointerEvents: 'none',
                        boxShadow: isScanning ? '0 0 20px rgba(25, 118, 210, 0.5)' : 'none',
                        animation: isScanning ? 'faceFramePulse 2s infinite' : 'none',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: -8,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 20,
                          height: 20,
                          borderTop: '3px solid',
                          borderLeft: '3px solid',
                          borderRight: '3px solid',
                          borderColor: 'inherit',
                          borderRadius: '10px 10px 0 0',
                        },
                      }}
                    />

                    {/* Corner markers - Góc khung */}
                    {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner) => (
                      <Box
                        key={corner}
                        sx={{
                          position: 'absolute',
                          width: 30,
                          height: 30,
                          borderColor: isScanning ? 'success.main' : 'white',
                          ...(corner === 'top-left' && {
                            top: 15,
                            left: 15,
                            borderTop: '4px solid',
                            borderLeft: '4px solid',
                          }),
                          ...(corner === 'top-right' && {
                            top: 15,
                            right: 15,
                            borderTop: '4px solid',
                            borderRight: '4px solid',
                          }),
                          ...(corner === 'bottom-left' && {
                            bottom: 50,
                            left: 15,
                            borderBottom: '4px solid',
                            borderLeft: '4px solid',
                          }),
                          ...(corner === 'bottom-right' && {
                            bottom: 50,
                            right: 15,
                            borderBottom: '4px solid',
                            borderRight: '4px solid',
                          }),
                        }}
                      />
                    ))}

                    {/* Scan line animation */}
                    {isScanning && (
                      <Box
                        sx={{
                          position: 'absolute',
                          left: '27.5%',
                          width: '45%',
                          height: '3px',
                          bgcolor: 'success.main',
                          boxShadow: '0 0 10px #4caf50',
                          animation: 'scanLine 2s ease-in-out infinite',
                          borderRadius: 1,
                        }}
                      />
                    )}

                    {/* Status indicator */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 10,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        bgcolor: isScanning ? 'success.main' : 'grey.700',
                        color: 'white',
                        px: 2,
                        py: 0.5,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      {isScanning ? (
                        <>
                          <CircularProgress size={14} color="inherit" />
                          <Typography variant="body2">Đang tìm kiếm...</Typography>
                        </>
                      ) : (
                        <Typography variant="body2">Đã dừng</Typography>
                      )}
                    </Box>
                  </>
                )}

                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </Box>

              {/* Camera Controls */}
              <Stack direction="row" spacing={2} justifyContent="center">
                {!isCameraOpen ? (
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<CameraIcon />}
                    onClick={startScanning}
                    disabled={!isAIReady}
                    sx={{ bgcolor: ADMIN_COLORS.primary, px: 4 }}
                  >
                    Bắt đầu quét
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    size="large"
                    color="error"
                    startIcon={<StopIcon />}
                    onClick={stopScanning}
                    sx={{ px: 4 }}
                  >
                    Dừng quét
                  </Button>
                )}
              </Stack>

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Result Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon /> Kết quả nhận diện
              </Typography>

              {!recognitionResult && !isScanning && !isCameraOpen && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    bgcolor: '#fafafa',
                    borderStyle: 'dashed',
                  }}
                >
                  <PersonIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">
                    Bắt đầu quét để tự động nhận diện khách hàng
                  </Typography>
                </Paper>
              )}

              {isScanning && !recognitionResult && !isNewCustomer && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    bgcolor: '#e3f2fd',
                    border: '2px solid',
                    borderColor: 'primary.main',
                  }}
                >
                  <CircularProgress size={60} sx={{ color: ADMIN_COLORS.primary, mb: 2 }} />
                  <Typography variant="h6" color="primary">
                    Đang tìm kiếm khách hàng...
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Đưa khuôn mặt vào giữa khung hình
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Đã quét {scanCount} lần {noMatchCount > 0 && `(${noMatchCount}/${MAX_SCANS_BEFORE_NEW_CUSTOMER} không tìm thấy)`}
                  </Typography>
                </Paper>
              )}

              {/* Khách hàng mới - Không tìm thấy trong hệ thống */}
              {isNewCustomer && !recognitionResult && (
                <Box>
                  <Alert 
                    severity="info" 
                    icon={<PersonAddIcon />}
                    sx={{ mb: 2 }}
                  >
                    <strong>👋 Khách hàng mới!</strong>
                    <br />
                    Không tìm thấy khuôn mặt trong hệ thống sau {noMatchCount} lần quét.
                  </Alert>

                  <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                    {/* Ảnh đã chụp */}
                    {capturedImage && (
                      <Box sx={{ mb: 2 }}>
                        <Avatar
                          src={capturedImage}
                          sx={{ 
                            width: 120, 
                            height: 120, 
                            mx: 'auto',
                            border: '3px solid',
                            borderColor: 'primary.main'
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Ảnh đã chụp
                        </Typography>
                      </Box>
                    )}

                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Bạn muốn tạo tài khoản cho khách hàng này?
                    </Typography>

                    <Stack spacing={2}>
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<PersonAddIcon />}
                        onClick={handleOpenCreateDialog}
                        sx={{ bgcolor: ADMIN_COLORS.primary }}
                      >
                        Tạo tài khoản mới
                      </Button>
                      
                      <Button
                        variant="outlined"
                        startIcon={<PhotoCameraIcon />}
                        onClick={retakePhoto}
                      >
                        Chụp lại ảnh
                      </Button>
                      
                      <Button
                        variant="text"
                        color="inherit"
                        onClick={resetAndScan}
                      >
                        Tiếp tục quét (bỏ qua)
                      </Button>
                    </Stack>
                  </Paper>
                </Box>
              )}

              {recognitionResult?.matched && (
                <Box>
                  <Alert 
                    severity="success" 
                    icon={<SuccessIcon />}
                    sx={{ mb: 2 }}
                  >
                    {recognitionResult.isNewlyCreated ? (
                      <>
                        <strong>✅ Đã tạo tài khoản thành công!</strong>
                        <br />
                        Khách hàng mới đã được thêm vào hệ thống.
                      </>
                    ) : (
                      <>
                        <strong>🎉 Đã tìm thấy khách hàng!</strong>
                        <br />
                        Độ tin cậy: {recognitionResult.confidence}%
                      </>
                    )}
                  </Alert>

                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar
                        src={getStaticFileUrl(recognitionResult.customer?.avatar)}
                        sx={{ width: 80, height: 80, bgcolor: ADMIN_COLORS.primary }}
                      >
                        {recognitionResult.customer?.name?.charAt(0)?.toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                          {recognitionResult.customer?.name}
                        </Typography>
                        <Chip
                          label={recognitionResult.customer?.loyalty_tier?.toUpperCase() || 'BRONZE'}
                          size="small"
                          color={
                            recognitionResult.customer?.loyalty_tier === 'gold' ? 'warning' :
                            recognitionResult.customer?.loyalty_tier === 'silver' ? 'default' : 'primary'
                          }
                          icon={<StarIcon />}
                        />
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Stack spacing={1.5}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body1">
                          {recognitionResult.customer?.email || 'Chưa cập nhật'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body1">
                          {recognitionResult.customer?.phone || 'Chưa cập nhật'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StarIcon fontSize="small" color="action" />
                        <Typography variant="body1">
                          Điểm tích lũy: <strong style={{ color: ADMIN_COLORS.primary, fontSize: '1.2em' }}>
                            {recognitionResult.customer?.loyalty_points || 0}
                          </strong>
                        </Typography>
                      </Box>
                    </Stack>

                    {/* 5 món gần nhất */}
                    {recognitionResult.recent_products && recognitionResult.recent_products.length > 0 && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Box>
                          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ShoppingBagIcon fontSize="small" />
                            5 món gần nhất
                          </Typography>
                          <Grid container spacing={1}>
                            {recognitionResult.recent_products.map((product, index) => (
                              <Grid item xs={6} key={product.id || index}>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    p: 1,
                                    borderRadius: 1,
                                    bgcolor: '#f5f5f5',
                                    '&:hover': { bgcolor: '#eeeeee' },
                                  }}
                                >
                                  <Avatar
                                    src={getStaticFileUrl(product.thumbnail)}
                                    variant="rounded"
                                    sx={{ width: 40, height: 40, bgcolor: 'grey.300' }}
                                  >
                                    {!product.thumbnail && product.name?.charAt(0)?.toUpperCase()}
                                  </Avatar>
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        fontWeight: 500,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      {product.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {new Intl.NumberFormat('vi-VN', { 
                                        style: 'currency', 
                                        currency: 'VND' 
                                      }).format(product.price || 0)}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      </>
                    )}

                    <Button
                      variant="outlined"
                      fullWidth
                      sx={{ mt: 2 }}
                      onClick={resetAndScan}
                    >
                      Tiếp tục quét
                    </Button>
                  </Paper>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* AI Suggestions Section - Gợi ý theo thời tiết */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ThermostatIcon color="primary" />
                Gợi ý theo thời tiết
              </Typography>

              {/* Temperature Input Form */}
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Nhiệt độ hiện tại (°C)"
                      type="number"
                      value={temperature}
                      onChange={(e) => {
                        setTemperature(e.target.value);
                        setUseLocation(false);
                      }}
                      disabled={useLocation && locationLoading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <ThermostatIcon sx={{ color: ADMIN_COLORS.primary }} />
                          </InputAdornment>
                        ),
                        endAdornment: <InputAdornment position="end">°C</InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={useLocation}
                          onChange={(e) => {
                            if (!navigator.geolocation) {
                              toast.error('Trình duyệt không hỗ trợ lấy vị trí');
                              return;
                            }
                            setUseLocation(e.target.checked);
                          }}
                          disabled={!navigator.geolocation}
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationIcon fontSize="small" />
                          <Typography variant="body2">Tự động lấy từ vị trí</Typography>
                        </Box>
                      }
                    />
                  </Grid>
                  {locationInfo && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        📍 {locationInfo.city && `${locationInfo.city}, `}
                        {locationInfo.country}
                      </Typography>
                    </Grid>
                  )}
                  {(suggestionsLoading || locationLoading) && (
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <CircularProgress size={24} />
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Paper>

              {/* Suggestions Grid */}
              {suggestions.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                    {suggestions.length} sản phẩm gợi ý
                  </Typography>
                  <Grid container spacing={2}>
                    {suggestions.map((product) => (
                      <Grid item xs={12} sm={6} md={4} key={product.id}>
                        <Card
                          sx={{
                            height: '100%',
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: 4,
                            },
                          }}
                          onClick={() => navigate(`/products/${product.id}`)}
                        >
                          <Box
                            sx={{
                              position: 'relative',
                              width: '100%',
                              paddingTop: '75%',
                              overflow: 'hidden',
                              bgcolor: '#f5f5f5',
                            }}
                          >
                            {product.thumbnail ? (
                              <Box
                                component="img"
                                src={getStaticFileUrl(product.thumbnail)}
                                alt={product.name}
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: '50%',
                                  left: '50%',
                                  transform: 'translate(-50%, -50%)',
                                  color: '#ccc',
                                }}
                              >
                                <ShoppingBagIcon sx={{ fontSize: 48 }} />
                              </Box>
                            )}
                            <Chip
                              icon={product.temperature === 'HOT' ? <FireIcon /> : <ColdIcon />}
                              label={product.temperature === 'HOT' ? 'Nóng' : 'Lạnh'}
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                bgcolor: product.temperature === 'HOT' ? '#ff6b35' : '#4a90e2',
                                color: 'white',
                                fontWeight: 'bold',
                              }}
                            />
                          </Box>
                          <CardContent>
                            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }} noWrap>
                              {product.name}
                            </Typography>
                            {product.categoryName && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {product.categoryName}
                              </Typography>
                            )}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                              <Typography variant="h6" color="primary" fontWeight="bold">
                                {new Intl.NumberFormat('vi-VN', {
                                  style: 'currency',
                                  currency: 'VND',
                                }).format(product.price || 0)}
                              </Typography>
                            </Box>
                            {product.reason && (
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
                                {product.reason}
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* Empty State */}
              {!suggestionsLoading && suggestions.length === 0 && temperature && (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <ThermostatIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Chưa có gợi ý. Vui lòng nhập nhiệt độ để xem gợi ý.
                  </Typography>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog tạo tài khoản mới */}
      <Dialog 
        open={showCreateDialog} 
        onClose={() => setShowCreateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAddIcon color="primary" />
          Tạo tài khoản khách hàng mới
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
            {/* Ảnh đã chụp */}
            <Box sx={{ textAlign: 'center', flexShrink: 0 }}>
              <Avatar
                src={capturedImage}
                sx={{ 
                  width: 100, 
                  height: 100, 
                  border: '3px solid',
                  borderColor: 'primary.main'
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Ảnh đại diện
              </Typography>
            </Box>
            
            {/* Form nhập thông tin */}
            <Stack spacing={2} sx={{ flex: 1 }}>
              <TextField
                label="Họ và tên *"
                fullWidth
                value={newCustomerData.name}
                onChange={(e) => setNewCustomerData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nguyễn Văn A"
              />
              <TextField
                label="Email *"
                type="email"
                fullWidth
                value={newCustomerData.email}
                onChange={(e) => setNewCustomerData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@example.com"
              />
              <TextField
                label="Số điện thoại"
                fullWidth
                value={newCustomerData.phone}
                onChange={(e) => setNewCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="0912345678"
              />
              <Alert severity="info" sx={{ py: 0.5 }}>
                Mật khẩu mặc định: <strong>12345678</strong>
              </Alert>
            </Stack>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button 
            onClick={() => setShowCreateDialog(false)}
            disabled={isCreating}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateCustomer}
            disabled={isCreating || !newCustomerData.name || !newCustomerData.email}
            startIcon={isCreating ? <CircularProgress size={16} /> : <PersonAddIcon />}
            sx={{ bgcolor: ADMIN_COLORS.primary }}
          >
            {isCreating ? 'Đang tạo...' : 'Tạo tài khoản'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CSS Animation */}
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.6; }
            100% { opacity: 1; }
          }
          @keyframes faceFramePulse {
            0% { opacity: 1; box-shadow: 0 0 20px rgba(25, 118, 210, 0.5); }
            50% { opacity: 0.7; box-shadow: 0 0 30px rgba(76, 175, 80, 0.7); }
            100% { opacity: 1; box-shadow: 0 0 20px rgba(25, 118, 210, 0.5); }
          }
          @keyframes scanLine {
            0% { top: 20%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 75%; opacity: 0; }
          }
        `}
      </style>
    </AdminPageLayout>
  );
};

export default FaceRecognition;
