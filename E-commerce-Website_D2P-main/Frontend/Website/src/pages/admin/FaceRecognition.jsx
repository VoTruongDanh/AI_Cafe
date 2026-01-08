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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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
  Videocam as VideocamIcon,
  SwitchCamera as SwitchCameraIcon,
} from '@mui/icons-material';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import { ADMIN_COLORS } from '../../constants/adminTheme';
import { faceRecognitionApi, adminUsersApi } from '../../services/api';
import api from '../../services/api';
import { toast } from 'react-toastify';

const SCAN_INTERVAL = 2000; // Quét mỗi 2 giây (giảm để nhận diện nhanh hơn)
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
  const [processingTime, setProcessingTime] = useState(null); // Thời gian xử lý (ms)
  const [debugInfo, setDebugInfo] = useState(null); // Thông tin debug
  
  // Face detection info
  const [faceBox, setFaceBox] = useState(null); // Bounding box của mặt [x1, y1, x2, y2]
  const [faceQuality, setFaceQuality] = useState(0); // Điểm chất lượng hiện tại
  const [bestFaceImage, setBestFaceImage] = useState(null); // Ảnh mặt đã crop tốt nhất
  const [bestFaceQuality, setBestFaceQuality] = useState(0); // Điểm chất lượng cao nhất
  const [faceDetectedCount, setFaceDetectedCount] = useState(0); // Số lần detect được mặt (có mặt trong frame)
  const [noFaceCount, setNoFaceCount] = useState(0); // Số lần không có mặt
  
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

  // Camera selection
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [loadingCameras, setLoadingCameras] = useState(false);

  // Lấy danh sách camera khi component mount
  useEffect(() => {
    const getCameras = async () => {
      setLoadingCameras(true);
      try {
        // Cần request permission trước để enumerate devices
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
        tempStream.getTracks().forEach(track => track.stop());
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setAvailableCameras(videoDevices);
        
        // Auto-select camera mặt trước (user) nếu có, hoặc camera đầu tiên
        const frontCamera = videoDevices.find(d => 
          d.label.toLowerCase().includes('front') || 
          d.label.toLowerCase().includes('user') ||
          d.label.toLowerCase().includes('trước')
        );
        if (frontCamera) {
          setSelectedCameraId(frontCamera.deviceId);
        } else if (videoDevices.length > 0) {
          setSelectedCameraId(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error('Error enumerating cameras:', err);
      } finally {
        setLoadingCameras(false);
      }
    };
    getCameras();
  }, []);

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
      
      // Cấu hình video constraints
      const videoConstraints = {
        width: { ideal: 640 },
        height: { ideal: 480 }
      };
      
      // Sử dụng camera đã chọn nếu có
      if (selectedCameraId) {
        videoConstraints.deviceId = { exact: selectedCameraId };
      } else {
        videoConstraints.facingMode = 'user';
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Không thể truy cập camera. Vui lòng cho phép quyền truy cập camera.');
    }
  }, [selectedCameraId]);

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
    
    // Chụp frame từ video với quality cao hơn
    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 480;
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    const ctx = canvas.getContext('2d');
    
    // Mirror ảnh vì video đã được mirror trong CSS
    ctx.translate(videoWidth, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
    
    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.95);
    console.log(`[SCAN] Canvas: ${videoWidth}x${videoHeight}, Data length: ${imageData.length}`);

    setScanCount(prev => prev + 1);
    setLastScanTime(new Date());

    const startTime = Date.now();

    try {
      const response = await faceRecognitionApi.recognize(imageData);
      const result = response.data;
      
      console.log('[API Response]', result); // Debug log
      
      // Cập nhật thông tin debug
      const clientTime = Date.now() - startTime;
      setProcessingTime(result.processing_time_ms || clientTime);
      setDebugInfo({
        cosine_similarity: result.cosine_similarity,
        all_matches: result.all_matches,
        message: result.message,
        server_time: result.processing_time_ms,
        client_time: clientTime,
        face_quality: result.face_quality,
        face_detected: result.face_detected,
        enhanced: result.enhanced,
        success: result.success,
        matched: result.matched,
      });
      
      // === KIỂM TRA CÓ DETECT ĐƯỢC MẶT KHÔNG ===
      if (!result.face_detected) {
        // KHÔNG có mặt trong frame - không so sánh, không đếm "khách mới"
        console.log(`[NO FACE] Scan #${scanCount + 1} - Không phát hiện khuôn mặt`, result);
        setFaceBox(null);
        setFaceQuality(0);
        setNoFaceCount(prev => prev + 1);
        // Không tăng noMatchCount vì chưa có mặt để so sánh
        return;
      }
      
      // === CÓ MẶT - Cập nhật face box ===
      setNoFaceCount(0); // Reset đếm không có mặt
      setFaceBox(result.face_box);
      setFaceQuality(result.face_quality || 0);
      setFaceDetectedCount(prev => prev + 1);
      
      // Lưu ảnh mặt tốt nhất (có quality cao nhất)
      const currentQuality = result.face_quality || 0;
      if (currentQuality > bestFaceQuality && result.cropped_face) {
        setBestFaceImage(result.cropped_face);
        setBestFaceQuality(currentQuality);
        console.log(`[BEST FACE] New best quality: ${currentQuality.toFixed(1)}%`);
      }

      if (result.matched) {
        // Tìm thấy khách hàng - dừng quét
        console.log(`[MATCH] Customer: ${result.customer?.name || result.customer_id}, Confidence: ${result.confidence}%`);
        setRecognitionResult(result);
        setIsScanning(false);
        setNoMatchCount(0);
        setIsNewCustomer(false);
        if (scanIntervalRef.current) {
          clearInterval(scanIntervalRef.current);
          scanIntervalRef.current = null;
        }
      } else {
        // CÓ MẶT nhưng KHÔNG MATCH với ai - đây mới là "potential new customer"
        const effectiveQuality = Math.max(currentQuality, bestFaceQuality);
        console.log(`[NO MATCH] Scan #${scanCount + 1}, Quality: ${currentQuality.toFixed(1)}%, Best: ${effectiveQuality.toFixed(1)}%`);
        
        // Tăng đếm và kiểm tra điều kiện hiện "khách mới"
        const newNoMatchCount = noMatchCount + 1;
        setNoMatchCount(newNoMatchCount);
        
        // Sau MAX_SCANS_BEFORE_NEW_CUSTOMER lần có mặt nhưng không match -> hiện khách mới
        if (newNoMatchCount >= MAX_SCANS_BEFORE_NEW_CUSTOMER && effectiveQuality > 30) {
          console.log(`[NEW CUSTOMER] Triggered after ${newNoMatchCount} scans, quality: ${effectiveQuality.toFixed(1)}%`);
          setIsNewCustomer(true);
          // Sử dụng ảnh mặt đã crop tốt nhất
          setCapturedImage(bestFaceImage || result.cropped_face);
          setIsScanning(false);
          if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
          }
        }
        setRecognitionResult(null);
      }
    } catch (err) {
      console.error('Scan error:', err);
      setDebugInfo({ error: err.message });
      setFaceBox(null);
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
    console.log('[RESET] Clearing all face data and restarting scan...');
    
    // Dừng scan hiện tại trước
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    // Clear TẤT CẢ dữ liệu cũ
    setRecognitionResult(null);
    setScanCount(0);
    setNoMatchCount(0);
    setIsNewCustomer(false);
    setCapturedImage(null);
    setFaceBox(null);
    setFaceQuality(0);
    setBestFaceImage(null);
    setBestFaceQuality(0);
    setDebugInfo(null);
    setFaceDetectedCount(0);
    setNoFaceCount(0);
    setProcessingTime(0);
    setError(null);
    
    // Đợi state clear xong rồi mới bắt đầu scan mới
    setTimeout(() => {
      setIsScanning(true);
      startRealtimeScan();
    }, 100);
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

  // Chụp lại ảnh - reset và quét lại để tìm ảnh tốt hơn
  const retakePhoto = () => {
    // Reset các state liên quan đến face capture
    setIsNewCustomer(false);
    setCapturedImage(null);
    setBestFaceImage(null);
    setBestFaceQuality(0);
    setNoMatchCount(0);
    setScanCount(0);
    setFaceBox(null);
    setFaceQuality(0);
    setFaceDetectedCount(0);
    setNoFaceCount(0);
    setDebugInfo(null);
    // Bắt đầu quét lại
    setIsScanning(true);
    startRealtimeScan();
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

  const isAIReady = statusData?.ai_service === 'online' && (statusData?.facenet_ready || statusData?.deepface_ready);

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
          {!(statusData?.facenet_ready || statusData?.deepface_ready) && (
            <>
              Face Recognition chưa được cài đặt. Vui lòng chạy:
              <code style={{ display: 'block', marginTop: 8, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                cd Backend/ai-temp-local<br />
                pip install facenet-pytorch torch torchvision opencv-python
              </code>
            </>
          )}
          {statusData?.ai_service !== 'online' && (
            <>
              AI Service không chạy. Vui lòng khởi động:
              <code style={{ display: 'block', marginTop: 8, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                cd Backend/ai-temp-local<br />
                python api.py
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
                    {processingTime && ` | Xử lý: ${processingTime}ms`}
                  </Typography>
                </Box>
              )}
              
              {/* Debug info - hiển thị face detection status */}
              {isScanning && (
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    {faceBox ? (
                      <Chip 
                        size="small"
                        icon={<SuccessIcon sx={{ fontSize: 16 }} />}
                        label={`Mặt: ${faceQuality.toFixed(0)}%`}
                        color={faceQuality > 50 ? 'success' : faceQuality > 30 ? 'warning' : 'default'}
                      />
                    ) : (
                      <Chip 
                        size="small"
                        icon={<FailIcon sx={{ fontSize: 16 }} />}
                        label="Không thấy mặt"
                        color="error"
                        variant="outlined"
                      />
                    )}
                    {bestFaceQuality > 0 && (
                      <Chip 
                        size="small"
                        label={`Tốt nhất: ${bestFaceQuality.toFixed(0)}%`}
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    {noMatchCount > 0 && (
                      <Chip 
                        size="small"
                        label={`Đã quét: ${noMatchCount}/${MAX_SCANS_BEFORE_NEW_CUSTOMER}`}
                        variant="outlined"
                      />
                    )}
                    {debugInfo?.enhanced && (
                      <Chip size="small" label="Auto-sáng" color="info" variant="outlined" />
                    )}
                  </Box>
                  {noFaceCount > 3 && (
                    <Alert severity="warning" sx={{ py: 0.5 }}>
                      <Typography variant="caption">
                        Không phát hiện khuôn mặt. Hãy đưa mặt vào khung hình và đảm bảo đủ ánh sáng.
                      </Typography>
                    </Alert>
                  )}
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
                    
                    {/* Face bounding box - Khung mặt detect được */}
                    {faceBox && videoRef.current && (() => {
                      // Video bị mirror (scaleX(-1)), cần tính ngược left
                      const videoW = videoRef.current.videoWidth || 640;
                      const videoH = videoRef.current.videoHeight || 480;
                      const boxW = ((faceBox[2] - faceBox[0]) / videoW) * 100;
                      const boxH = ((faceBox[3] - faceBox[1]) / videoH) * 100;
                      // Mirror: left trở thành 100% - right
                      const mirroredLeft = 100 - ((faceBox[2] / videoW) * 100);
                      const topPercent = (faceBox[1] / videoH) * 100;
                      
                      return (
                        <Box
                          sx={{
                            position: 'absolute',
                            left: `${mirroredLeft}%`,
                            top: `${topPercent}%`,
                            width: `${boxW}%`,
                            height: `${boxH}%`,
                            border: '4px solid',
                            borderColor: recognitionResult?.matched 
                              ? '#4CAF50' 
                              : faceQuality > 50 
                                ? '#2196F3' 
                                : faceQuality > 30 
                                  ? '#FF9800'
                                  : '#f44336',
                            borderRadius: '12px',
                            pointerEvents: 'none',
                            boxShadow: recognitionResult?.matched 
                              ? '0 0 25px rgba(76,175,80,0.7), inset 0 0 20px rgba(76,175,80,0.2)' 
                              : '0 0 15px rgba(33,150,243,0.5)',
                            transition: 'all 0.1s ease-out',
                            zIndex: 20,
                          }}
                        >
                          {/* Quality score badge */}
                          <Box
                            sx={{
                              position: 'absolute',
                              top: -28,
                              left: '50%',
                              transform: 'translateX(-50%)',
                              bgcolor: faceQuality > 50 ? '#4CAF50' : faceQuality > 30 ? '#FF9800' : '#f44336',
                              color: 'white',
                              px: 1.5,
                              py: 0.5,
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 'bold',
                              whiteSpace: 'nowrap',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                            }}
                          >
                            {faceQuality.toFixed(0)}%
                          </Box>
                        </Box>
                      );
                    })()}
                    
                    {/* Guide frame khi chưa detect được mặt */}
                    {!faceBox && isScanning && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '45%',
                          height: '60%',
                          border: '2px dashed',
                          borderColor: 'grey.500',
                          borderRadius: 2,
                          pointerEvents: 'none',
                          opacity: 0.5,
                        }}
                      />
                    )}

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

              {/* Camera Selection */}
              {availableCameras.length > 1 && (
                <Box sx={{ mb: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="camera-select-label">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <VideocamIcon fontSize="small" />
                        Chọn Camera
                      </Box>
                    </InputLabel>
                    <Select
                      labelId="camera-select-label"
                      value={selectedCameraId}
                      label="Chọn Camera"
                      onChange={(e) => {
                        const newCameraId = e.target.value;
                        setSelectedCameraId(newCameraId);
                        // Nếu đang quét, dừng và bắt đầu lại với camera mới
                        if (isCameraOpen) {
                          // Dừng stream hiện tại
                          if (streamRef.current) {
                            streamRef.current.getTracks().forEach(track => track.stop());
                          }
                          if (scanIntervalRef.current) {
                            clearInterval(scanIntervalRef.current);
                          }
                          setIsCameraOpen(false);
                          setIsScanning(false);
                          // Bắt đầu lại sau 300ms
                          setTimeout(async () => {
                            try {
                              const stream = await navigator.mediaDevices.getUserMedia({
                                video: {
                                  deviceId: { exact: newCameraId },
                                  width: { ideal: 640 },
                                  height: { ideal: 480 }
                                }
                              });
                              streamRef.current = stream;
                              setIsCameraOpen(true);
                            } catch (err) {
                              console.error('Error switching camera:', err);
                              setError('Không thể chuyển camera');
                            }
                          }, 300);
                        }
                      }}
                      disabled={loadingCameras}
                    >
                      {availableCameras.map((camera, index) => (
                        <MenuItem key={camera.deviceId} value={camera.deviceId}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <VideocamIcon fontSize="small" color="action" />
                            {camera.label || `Camera ${index + 1}`}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {availableCameras.length > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Tìm thấy {availableCameras.length} camera
                    </Typography>
                  )}
                </Box>
              )}

              {/* Camera Controls */}
              <Stack direction="row" spacing={2} justifyContent="center" alignItems="center" flexWrap="wrap">
                {!isCameraOpen ? (
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<CameraIcon />}
                    onClick={startScanning}
                    disabled={!isAIReady || loadingCameras}
                    sx={{ bgcolor: ADMIN_COLORS.primary, px: 4 }}
                  >
                    {loadingCameras ? 'Đang tải camera...' : 'Bắt đầu quét'}
                  </Button>
                ) : (
                  <>
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
                    
                    {/* Quick switch camera button - hiển thị khi có >= 2 camera */}
                    {availableCameras.length >= 2 && (
                      <IconButton
                        onClick={() => {
                          // Tìm camera tiếp theo trong danh sách
                          const currentIndex = availableCameras.findIndex(c => c.deviceId === selectedCameraId);
                          const nextIndex = (currentIndex + 1) % availableCameras.length;
                          const nextCamera = availableCameras[nextIndex];
                          
                          // Trigger change
                          const event = { target: { value: nextCamera.deviceId } };
                          setSelectedCameraId(nextCamera.deviceId);
                          
                          // Dừng stream hiện tại và chuyển sang camera mới
                          if (streamRef.current) {
                            streamRef.current.getTracks().forEach(track => track.stop());
                          }
                          if (scanIntervalRef.current) {
                            clearInterval(scanIntervalRef.current);
                          }
                          setIsCameraOpen(false);
                          setIsScanning(false);
                          
                          setTimeout(async () => {
                            try {
                              const stream = await navigator.mediaDevices.getUserMedia({
                                video: {
                                  deviceId: { exact: nextCamera.deviceId },
                                  width: { ideal: 640 },
                                  height: { ideal: 480 }
                                }
                              });
                              streamRef.current = stream;
                              setIsCameraOpen(true);
                            } catch (err) {
                              console.error('Error switching camera:', err);
                              setError('Không thể chuyển camera');
                            }
                          }, 300);
                        }}
                        sx={{
                          bgcolor: 'background.paper',
                          border: '1px solid',
                          borderColor: 'divider',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                        title="Đổi camera"
                      >
                        <SwitchCameraIcon />
                      </IconButton>
                    )}
                  </>
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
                    {/* Ảnh mặt đã crop (tốt nhất) */}
                    {capturedImage && (
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ position: 'relative', display: 'inline-block' }}>
                          <Avatar
                            src={capturedImage}
                            sx={{ 
                              width: 140, 
                              height: 140, 
                              mx: 'auto',
                              border: '4px solid',
                              borderColor: bestFaceQuality > 50 ? 'success.main' : 'warning.main'
                            }}
                          />
                          <Chip
                            size="small"
                            label={`Chất lượng: ${bestFaceQuality.toFixed(0)}%`}
                            color={bestFaceQuality > 50 ? 'success' : 'warning'}
                            sx={{
                              position: 'absolute',
                              bottom: -10,
                              left: '50%',
                              transform: 'translateX(-50%)',
                            }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                          Ảnh khuôn mặt đã crop (tốt nhất trong {scanCount} lần quét)
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
                        Chụp lại (lấy ảnh rõ hơn)
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
