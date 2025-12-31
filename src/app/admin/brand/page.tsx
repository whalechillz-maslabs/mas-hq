'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/supabase';
import { 
  Package, TrendingUp, ShoppingCart, Palette, 
  Building2, Store, Settings, ArrowLeft,
  CheckCircle, Clock, AlertCircle, DollarSign, 
  ShoppingBag, Truck, FileText, X, TrendingDown
} from 'lucide-react';

interface DashboardData {
  summary: {
    totalOrders: number;
    totalProductPrice: number;
    totalEmbroideryFee: number;
    totalFinalAmount: number;
  };
  orders: {
    completed: number;
    inProgress: number;
    total: number;
  };
  brandStats: Array<{
    name: string;
    code: string;
    totalOrders: number;
    totalAmount: number;
    completedOrders: number;
    inProgressOrders: number;
  }>;
  recentOrders: any[];
}

interface Brand {
  id: string;
  name: string;
  code: string;
  description: string;
  brand_type: string;
  stats: {
    totalOrders: number;
    totalAmount: number;
    completedOrders: number;
  };
}

export default function BrandPortfolioPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'progress' | 'sourcing' | 'design' | 'brand' | 'supplier'>('progress');
  const [progressSubTab, setProgressSubTab] = useState<string>('overview'); // overview, ball-caps, bucket-hats, pouches, t-shirts, sweatshirts
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [sourcingData, setSourcingData] = useState<any[]>([]);
  const [sourcingCategory, setSourcingCategory] = useState<string>('ball-caps');
  const [designsData, setDesignsData] = useState<any[]>([]);
  const [suppliersData, setSuppliersData] = useState<any[]>([]);
  const [productsData, setProductsData] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [progressHistory, setProgressHistory] = useState<{ [orderNumber: string]: any[] }>({});
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  
  // CRUD 모달 상태
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showProgressFormModal, setShowProgressFormModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editingProgress, setEditingProgress] = useState<any>(null);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [syncingOrder, setSyncingOrder] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading && currentUser) {
      loadData();
    }
  }, [isLoading, currentUser, activeTab, sourcingCategory]);

  // 제품 데이터 별도 로드
  useEffect(() => {
    if (!isLoading && currentUser && activeTab === 'progress' && progressSubTab !== 'overview') {
      const loadProducts = async () => {
        setProductsLoading(true);
        const categoryMap: { [key: string]: string } = {
          'ball-caps': 'ball-caps',
          'bucket-hats': 'bucket-hats',
          'pouches': 'pouches',
          't-shirts': 't-shirts',
          'sweatshirts': 'sweatshirts'
        };
        const category = categoryMap[progressSubTab];
        if (category) {
          try {
            const productsRes = await fetch(`/api/brand/products?category=${category}`);
            if (productsRes.ok) {
              const productsResult = await productsRes.json();
              if (productsResult.success) {
                setProductsData(productsResult.data || []);
              } else {
                console.error('제품 데이터 로드 실패:', productsResult.error);
                setProductsData([]);
              }
            } else {
              console.error('제품 API 오류:', productsRes.status);
              setProductsData([]);
            }
          } catch (error) {
            console.error('제품 데이터 로드 중 오류:', error);
            setProductsData([]);
          }
        }
        setProductsLoading(false);
      };
      loadProducts();
    } else if (activeTab === 'progress' && progressSubTab === 'overview') {
      setProductsData([]);
      setProductsLoading(false);
    }
  }, [isLoading, currentUser, activeTab, progressSubTab]);

  const checkAuth = async () => {
    try {
      const user = await auth.getCurrentUser();
      
      if (!user) {
        router.push('/login');
        return;
      }
      
      // 관리자/매니저 권한 확인
      const isManager = user.role_id === 'admin' || 
                       user.role_id === 'manager' ||
                       user.employee_id === 'MASLABS-001' ||
                       user.name === '시스템 관리자' ||
                       user.name === '김탁수';
      
      if (!isManager) {
        alert('관리자 또는 매니저 권한이 필요합니다.');
        router.push('/dashboard');
        return;
      }
      
      setCurrentUser(user);
      setIsLoading(false);
    } catch (error) {
      console.error('인증 확인 오류:', error);
      router.push('/login');
    }
  };

  const loadData = async () => {
    try {
      setDataLoading(true);

      // 대시보드 데이터 로드
      if (activeTab === 'progress') {
        const dashboardRes = await fetch('/api/brand/dashboard');
        if (dashboardRes.ok) {
          const dashboardResult = await dashboardRes.json();
          if (dashboardResult.success) {
            setDashboardData(dashboardResult.data);
          }
        }

        // 주문 데이터 로드
        const ordersRes = await fetch('/api/brand/orders');
        if (ordersRes.ok) {
          const ordersResult = await ordersRes.json();
          if (ordersResult.success) {
            setOrders(ordersResult.data);
          }
        }
      }

      // 브랜드 데이터 로드
      if (activeTab === 'brand') {
        const brandsRes = await fetch('/api/brand/brands');
        if (brandsRes.ok) {
          const brandsResult = await brandsRes.json();
          if (brandsResult.success) {
            setBrands(brandsResult.data);
          }
        }
      }

      // 상품소싱 데이터 로드
      if (activeTab === 'sourcing') {
        const sourcingRes = await fetch(`/api/brand/sourcing?category=${sourcingCategory}`);
        if (sourcingRes.ok) {
          const sourcingResult = await sourcingRes.json();
          if (sourcingResult.success) {
            setSourcingData(sourcingResult.data || []);
          }
        }
      }

      // 디자인 빌드업 데이터 로드
      if (activeTab === 'design') {
        const designsRes = await fetch('/api/brand/designs');
        if (designsRes.ok) {
          const designsResult = await designsRes.json();
          if (designsResult.success) {
            setDesignsData(designsResult.data || []);
          }
        }
      }

      // 업체 조사 데이터 로드
      if (activeTab === 'supplier') {
        const suppliersRes = await fetch('/api/brand/suppliers');
        if (suppliersRes.ok) {
          const suppliersResult = await suppliersRes.json();
          if (suppliersResult.success) {
            setSuppliersData(suppliersResult.data || []);
          }
        }
      }

      // 제품 데이터는 별도로 로드 (진행 상황 탭의 제품별 하위 탭용)
      if (activeTab === 'progress' && progressSubTab === 'overview') {
        // overview 탭일 때는 제품 데이터 초기화
        setProductsData([]);
        setProductsLoading(false);
      }
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    } finally {
      setDataLoading(false);
    }
  };

  // 진행사항 로드 함수
  const loadProgressHistory = async (orderNumber: string) => {
    try {
      const response = await fetch(`/api/brand/orders/progress?order_number=${orderNumber}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setProgressHistory((prev) => ({
            ...prev,
            [orderNumber]: result.data || []
          }));
        }
      }
    } catch (error) {
      console.error('진행사항 로드 오류:', error);
    }
  };

  // 주문번호 클릭 핸들러 - 마플 주문 상세 페이지로 이동
  const handleOrderNumberClick = (orderNumber: string) => {
    window.open(`https://www.marpple.com/kr/order/detail/${orderNumber}`, '_blank');
  };

  // 마플 스크래핑 동기화
  const handleMarppleSync = async (orderNumber: string) => {
    try {
      setSyncingOrder(orderNumber);
      const response = await fetch('/api/marpple/scrape-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('마플 주문 정보가 동기화되었습니다.');
        loadData(); // 데이터 새로고침
      } else {
        alert(`동기화 실패: ${result.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('마플 동기화 오류:', error);
      alert('동기화 중 오류가 발생했습니다.');
    } finally {
      setSyncingOrder(null);
    }
  };

  // 주문 생성/수정
  const handleSaveOrder = async (orderData: any) => {
    try {
      const url = editingOrder 
        ? '/api/brand/orders' 
        : '/api/brand/orders';
      const method = editingOrder ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingOrder ? { id: editingOrder.id, ...orderData } : orderData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(editingOrder ? '주문이 수정되었습니다.' : '주문이 생성되었습니다.');
        setShowOrderModal(false);
        setEditingOrder(null);
        loadData();
      } else {
        alert(`저장 실패: ${result.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('주문 저장 오류:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  // 주문 삭제
  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('정말 이 주문을 취소하시겠습니까?')) return;
    
    try {
      const response = await fetch(`/api/brand/orders?id=${orderId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('주문이 취소되었습니다.');
        loadData();
      } else {
        alert(`삭제 실패: ${result.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('주문 삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 진행사항 추가/수정
  const handleSaveProgress = async (progressData: any) => {
    try {
      const url = '/api/brand/orders/progress';
      const method = editingProgress ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProgress ? { id: editingProgress.id, ...progressData } : progressData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(editingProgress ? '진행사항이 수정되었습니다.' : '진행사항이 추가되었습니다.');
        setShowProgressFormModal(false);
        setEditingProgress(null);
        if (progressData.order_id) {
          const order = orders.find(o => o.id === progressData.order_id);
          if (order) {
            loadProgressHistory(order.order_number);
          }
        }
      } else {
        alert(`저장 실패: ${result.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('진행사항 저장 오류:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  // 추가 결제 등록/수정
  const handleSavePayment = async (paymentData: any) => {
    try {
      const url = '/api/brand/orders/additional-payments';
      const method = editingPayment ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPayment ? { id: editingPayment.id, ...paymentData } : paymentData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(editingPayment ? '추가 결제가 수정되었습니다.' : '추가 결제가 등록되었습니다.');
        setShowPaymentModal(false);
        setEditingPayment(null);
        loadData();
      } else {
        alert(`저장 실패: ${result.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('추가 결제 저장 오류:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  // 추가 결제 삭제
  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('정말 이 추가 결제를 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch(`/api/brand/orders/additional-payments?id=${paymentId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('추가 결제가 삭제되었습니다.');
        loadData();
      } else {
        alert(`삭제 실패: ${result.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('추가 결제 삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 mx-auto"></div>
          <p className="mt-4 text-slate-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex items-center space-x-3">
                  <Package className="h-6 w-6 text-slate-700" />
                  <h1 className="text-2xl font-semibold text-slate-900">브랜드 포트폴리오</h1>
                </div>
              </div>
            <div className="text-sm text-gray-500">
              {currentUser?.name || '사용자'}
            </div>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('progress')}
              className={`${
                activeTab === 'progress'
                  ? 'border-slate-700 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>진행 상황</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('sourcing')}
              className={`${
                activeTab === 'sourcing'
                  ? 'border-slate-700 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-4 w-4" />
                <span>상품소싱</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('design')}
              className={`${
                activeTab === 'design'
                  ? 'border-slate-700 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <div className="flex items-center space-x-2">
                <Palette className="h-4 w-4" />
                <span>디자인 빌드업</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('brand')}
              className={`${
                activeTab === 'brand'
                  ? 'border-slate-700 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4" />
                <span>브랜드</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('supplier')}
              className={`${
                activeTab === 'supplier'
                  ? 'border-slate-700 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <div className="flex items-center space-x-2">
                <Store className="h-4 w-4" />
                <span>업체 조사</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'progress' && (
          <div className="space-y-6">
            {/* 제품별 하위 탭 */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex space-x-2 mb-6 border-b">
                <button
                  onClick={() => setProgressSubTab('overview')}
                  className={`px-4 py-2 font-medium text-sm transition-colors ${
                    progressSubTab === 'overview'
                      ? 'border-b-2 border-slate-700 text-slate-900'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  전체 진행
                </button>
                <button
                  onClick={() => setProgressSubTab('ball-caps')}
                  className={`px-4 py-2 font-medium text-sm transition-colors ${
                    progressSubTab === 'ball-caps'
                      ? 'border-b-2 border-slate-700 text-slate-900'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  베이직 볼캡
                </button>
                <button
                  onClick={() => setProgressSubTab('bucket-hats')}
                  className={`px-4 py-2 font-medium text-sm transition-colors ${
                    progressSubTab === 'bucket-hats'
                      ? 'border-b-2 border-slate-700 text-slate-900'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  버킷햇
                </button>
                <button
                  onClick={() => setProgressSubTab('pouches')}
                  className={`px-4 py-2 font-medium text-sm transition-colors ${
                    progressSubTab === 'pouches'
                      ? 'border-b-2 border-slate-700 text-slate-900'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  클러치백
                </button>
                <button
                  onClick={() => setProgressSubTab('t-shirts')}
                  className={`px-4 py-2 font-medium text-sm transition-colors ${
                    progressSubTab === 't-shirts'
                      ? 'border-b-2 border-slate-700 text-slate-900'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  티셔츠
                </button>
                <button
                  onClick={() => setProgressSubTab('sweatshirts')}
                  className={`px-4 py-2 font-medium text-sm transition-colors ${
                    progressSubTab === 'sweatshirts'
                      ? 'border-b-2 border-slate-700 text-slate-900'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  맨투맨
                </button>
              </div>
            </div>

            {dataLoading ? (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 mx-auto"></div>
                <p className="mt-4 text-slate-600">데이터를 불러오는 중...</p>
              </div>
            ) : progressSubTab === 'overview' ? (
              <>
                {/* 전체 진행 대시보드 */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-slate-900 mb-6">📊 전체 진행 대시보드</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    {/* 총 주문 건수 - 보라색 그라데이션 */}
                    <div 
                      className="rounded-xl p-6 text-white text-center shadow-lg"
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        boxShadow: '0 4px 12px rgba(102,126,234,0.3)'
                      }}
                    >
                      <div className="text-sm opacity-90 mb-2">총 주문 건수</div>
                      <div className="text-4xl font-bold">
                        {dashboardData?.summary.totalOrders || 0}개
                      </div>
                      <div className="text-xs opacity-90 mt-2">(제품 수량 합계)</div>
                    </div>

                    {/* 총 상품 금액 - 핑크/빨강 그라데이션 */}
                    <div 
                      className="rounded-xl p-6 text-white text-center shadow-lg"
                      style={{
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        boxShadow: '0 4px 12px rgba(245,87,108,0.3)'
                      }}
                    >
                      <div className="text-sm opacity-90 mb-2">총 상품 금액</div>
                      <div className="text-4xl font-bold">
                        ₩{dashboardData?.summary.totalProductPrice.toLocaleString() || 0}
                      </div>
                    </div>

                    {/* 총 자수비 - 파란색 그라데이션 */}
                    <div 
                      className="rounded-xl p-6 text-white text-center shadow-lg"
                      style={{
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        boxShadow: '0 4px 12px rgba(79,172,254,0.3)'
                      }}
                    >
                      <div className="text-sm opacity-90 mb-2">총 자수비</div>
                      <div className="text-4xl font-bold">
                        ₩{dashboardData?.summary.totalEmbroideryFee.toLocaleString() || 0}
                      </div>
                    </div>

                    {/* 최종 결제 금액 - 초록색 그라데이션 */}
                    <div 
                      className="rounded-xl p-6 text-white text-center shadow-lg"
                      style={{
                        background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                        boxShadow: '0 4px 12px rgba(67,233,123,0.3)'
                      }}
                    >
                      <div className="text-sm opacity-90 mb-2">최종 결제 금액</div>
                      <div className="text-4xl font-bold">
                        ₩{dashboardData?.summary.totalFinalAmount.toLocaleString() || 0}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 완료된 주문 */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-slate-900">완료된 주문</h2>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => {
                          setEditingOrder(null);
                          setShowOrderModal(true);
                        }}
                        className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 text-sm font-medium flex items-center space-x-2 transition-colors"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        <span>주문 추가</span>
                      </button>
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                        <CheckCircle className="h-4 w-4 inline mr-1" />
                        {dashboardData?.orders.completed || 0}건
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {orders
                      .filter(order => order.status === 'completed')
                      .map((order) => (
                        <div key={order.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-slate-900">
                                {order.order_details?.product_name || '제품명 없음'} ({order.brand?.name || '브랜드 없음'})
                              </h3>
                              <p className="text-sm text-slate-600 mt-1">
                                {order.quantity}개 · ₩{order.product_price.toLocaleString()}
                              </p>
                              {order.order_details && (
                                <p className="text-xs text-slate-500 mt-2">
                                  {JSON.stringify(order.order_details).replace(/[{}"]/g, ' ').substring(0, 100)}
                                </p>
                              )}
                              <p className="text-xs text-slate-400 mt-1">주문번호: {order.order_number}</p>
                            </div>
                            <div className="text-right flex flex-col items-end space-y-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                <Truck className="h-3 w-3 mr-1" />
                                배송 완료
                              </span>
                              {order.delivery_date && (
                                <p className="text-xs text-slate-400">{order.delivery_date}</p>
                              )}
                              <div className="flex space-x-2 mt-2">
                                <button
                                  onClick={() => handleMarppleSync(order.order_number)}
                                  disabled={syncingOrder === order.order_number}
                                  className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200 disabled:opacity-50 transition-colors"
                                  title="마플 동기화"
                                >
                                  {syncingOrder === order.order_number ? '동기화 중...' : '🔄 동기화'}
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingOrder(order);
                                    setShowOrderModal(true);
                                  }}
                                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                >
                                  수정
                                </button>
                                <button
                                  onClick={() => handleDeleteOrder(order.id)}
                                  className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors"
                                >
                                  삭제
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    {orders.filter(order => order.status === 'completed').length === 0 && (
                      <p className="text-center text-slate-500 py-8">완료된 주문이 없습니다.</p>
                    )}
                  </div>
                </div>

                {/* 진행 중인 주문 */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-slate-900">진행 중인 주문</h2>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => {
                          setEditingOrder(null);
                          setShowOrderModal(true);
                        }}
                        className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 text-sm font-medium flex items-center space-x-2 transition-colors"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        <span>주문 추가</span>
                      </button>
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                        <Clock className="h-4 w-4 inline mr-1" />
                        {dashboardData?.orders.inProgress || 0}건
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {orders
                      .filter(order => order.status === 'preparing' || order.status === 'in_progress')
                      .map((order) => (
                        <div key={order.id} className="border rounded-lg p-4 border-slate-200 bg-slate-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-slate-900">
                                {order.order_details?.product_name || '제품명 없음'} ({order.brand?.name || '브랜드 없음'})
                              </h3>
                              <p className="text-sm text-slate-600 mt-1">
                                {order.quantity}개 · ₩{order.product_price.toLocaleString()}
                              </p>
                              {order.order_details && (
                                <p className="text-xs text-slate-500 mt-2">
                                  {JSON.stringify(order.order_details).replace(/[{}"]/g, ' ').substring(0, 100)}
                                </p>
                              )}
                              <p className="text-xs text-slate-400 mt-1">주문번호: {order.order_number}</p>
                            </div>
                            <div className="text-right flex flex-col items-end space-y-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                <Clock className="h-3 w-3 mr-1" />
                                {order.status === 'preparing' ? '제작 준비중' : '제작 중'}
                              </span>
                              <div className="flex space-x-2 mt-2">
                                <button
                                  onClick={() => handleMarppleSync(order.order_number)}
                                  disabled={syncingOrder === order.order_number}
                                  className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200 disabled:opacity-50 transition-colors"
                                  title="마플 동기화"
                                >
                                  {syncingOrder === order.order_number ? '동기화 중...' : '🔄 동기화'}
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingOrder(order);
                                    setShowOrderModal(true);
                                  }}
                                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                >
                                  수정
                                </button>
                                <button
                                  onClick={() => handleDeleteOrder(order.id)}
                                  className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors"
                                >
                                  삭제
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    {orders.filter(order => order.status === 'preparing' || order.status === 'in_progress').length === 0 && (
                      <p className="text-center text-gray-500 py-8">진행 중인 주문이 없습니다.</p>
                    )}
                  </div>
                </div>
              </>
            ) : progressSubTab === 'ball-caps' ? (
              <>
                {/* 베이직 볼캡 가격 정보 */}
                {productsLoading ? (
                  <div className="bg-white rounded-lg shadow p-6 text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 mx-auto"></div>
                    <p className="mt-4 text-gray-600">베이직 볼캡 데이터를 불러오는 중...</p>
                  </div>
                ) : productsData.length > 0 ? (
                  productsData.filter((p: any) => p.name === '베이직 볼캡' || p.code === 'basic-cap').map((product: any) => {
                    const specs = product.specifications || {};
                    const costPrice = product.base_price + product.embroidery_price; // 원가 (개별단가)
                    const normalPrice = specs.normal_price || 0; // 정상판매가
                    const discountPrice = specs.discount_price || 0; // 할인가
                    const discountRate = specs.discount_rate || 0; // 할인율

                    return (
                      <div key={product.id} className="space-y-6">
                      <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">💰 베이직 볼캡 가격 정보</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg p-6 text-white">
                            <p className="text-sm opacity-90 mb-2">원가 (개별단가)</p>
                            <p className="text-3xl font-bold">{costPrice.toLocaleString()}원</p>
                            <p className="text-xs opacity-90 mt-2">자수비 포함</p>
                          </div>
                          <div className="bg-gradient-to-br from-pink-500 to-pink-700 rounded-lg p-6 text-white">
                            <p className="text-sm opacity-90 mb-2">정상판매가</p>
                            <p className="text-3xl font-bold">{normalPrice.toLocaleString()}원</p>
                            <p className="text-xs opacity-90 mt-2">매장 디스플레이 가격</p>
                          </div>
                          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg p-6 text-white">
                            <p className="text-sm opacity-90 mb-2">할인가</p>
                            <p className="text-3xl font-bold">{discountPrice.toLocaleString()}원</p>
                            <p className="text-xs opacity-90 mt-2">실제 판매 가격</p>
                          </div>
                          <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-lg p-6 text-white">
                            <p className="text-sm opacity-90 mb-2">할인율</p>
                            <p className="text-3xl font-bold">{discountRate}%</p>
                            <p className="text-xs opacity-90 mt-2">정상가 대비</p>
                          </div>
                        </div>
                      </div>

                      {/* 최종 제작 제품 테이블 */}
                      <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">📦 최종 제작 제품</h2>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse text-sm">
                            <thead>
                              <tr className="bg-gray-50 border-b-2 border-gray-200">
                                <th className="p-3 text-center font-bold">이미지</th>
                                <th className="p-3 text-left font-bold">제품명</th>
                                <th className="p-3 text-center font-bold">색상</th>
                                <th className="p-3 text-center font-bold">수량</th>
                                <th className="p-3 text-center font-bold">원가/개</th>
                                <th className="p-3 text-center font-bold">정상가</th>
                                <th className="p-3 text-center font-bold">할인가</th>
                                <th className="p-3 text-center font-bold">주문#</th>
                                <th className="p-3 text-center font-bold">링크</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orders
                                .filter((order: any) => order.order_details?.product_name === '베이직 볼캡')
                                .flatMap((order: any) => {
                                  const colors = order.order_details?.colors || {};
                                  return Object.entries(colors).map(([color, qty]: [string, any]) => {
                                    // 색상별 pc_id 매핑
                                    const pcIdMap: { [key: string]: string } = {
                                      'navy': '23575351',    // 네이비
                                      'beige': '23575346',   // 베이지
                                      'black': '23575350',   // 블랙
                                      'white': '23575340'    // 화이트
                                    };
                                    
                                    return {
                                      order,
                                      color,
                                      qty: Number(qty),
                                      colorName: color === 'navy' ? '네이비' : color === 'black' ? '블랙' : color === 'beige' ? '베이지' : '화이트',
                                      imagePath: `/images/products/ball-caps/photos/cap-${color}-detail.png`,
                                      marppleUrl: `https://www.marpple.com/kr/product/detail?bp_id=2976&pc_id=${pcIdMap[color] || '23575351'}`
                                    };
                                  });
                                })
                                .map((item: any, idx: number) => (
                                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="p-3 text-center">
                                      <img
                                        src={item.imagePath}
                                        alt={`베이직 볼캡 (${item.colorName})`}
                                        className="w-16 h-16 object-contain mx-auto"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                      />
                                    </td>
                                    <td className="p-3 font-semibold">베이직 볼캡</td>
                                    <td className="p-3 text-center">{item.colorName}</td>
                                    <td className="p-3 text-center">{item.qty}개</td>
                                    <td className="p-3 text-center">{costPrice.toLocaleString()}원</td>
                                    <td className="p-3 text-center">{normalPrice.toLocaleString()}원</td>
                                    <td className="p-3 text-center text-slate-700 font-semibold">{discountPrice.toLocaleString()}원</td>
                                    <td className="p-3 text-center">
                                      <button
                                        onClick={() => handleOrderNumberClick(item.order.order_number)}
                                        className="text-slate-700 hover:text-slate-900 font-semibold cursor-pointer underline transition-colors"
                                      >
                                        {item.order.order_number}
                                      </button>
                                    </td>
                                    <td className="p-3 text-center">
                                      <a
                                        href={item.marppleUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-slate-700 hover:text-slate-900 text-xs transition-colors"
                                      >
                                        보기
                                      </a>
                                    </td>
                                  </tr>
                                ))}
                                {/* 합계 행 */}
                                {(() => {
                                  const filteredOrders = orders.filter((order: any) => order.order_details?.product_name === '베이직 볼캡');
                                  const allItems = filteredOrders.flatMap((order: any) => {
                                    const colors = order.order_details?.colors || {};
                                    return Object.entries(colors).map(([color, qty]: [string, any]) => ({
                                      color,
                                      qty: Number(qty)
                                    }));
                                  });
                                  const totalQuantity = allItems.reduce((sum, item) => sum + item.qty, 0);
                                  const uniqueColors = new Set(allItems.map(item => item.color));
                                  const itemsPerColor = totalQuantity / uniqueColors.size;
                                  const totalCost = totalQuantity * costPrice;
                                  const totalNormalPrice = totalQuantity * normalPrice;
                                  const totalDiscountPrice = totalQuantity * discountPrice;
                                  
                                  return (
                                    <tr className="bg-slate-50 font-semibold border-t-2 border-slate-300">
                                      <td colSpan={3} className="p-3 text-right border-t-2 border-slate-300">합계</td>
                                      <td className="p-3 text-center border-t-2 border-slate-300 text-slate-900">
                                        {totalQuantity}개
                                        <br />
                                        <small className="font-normal text-gray-500">({uniqueColors.size}종 × {itemsPerColor}개)</small>
                                      </td>
                                      <td className="p-3 text-center border-t-2 border-slate-300 text-slate-700 font-semibold">{totalCost.toLocaleString()}원</td>
                                      <td className="p-3 text-center border-t-2 border-slate-300 text-slate-600">{totalNormalPrice.toLocaleString()}원</td>
                                      <td className="p-3 text-center border-t-2 border-slate-300 text-slate-700">{totalDiscountPrice.toLocaleString()}원</td>
                                      <td colSpan={2} className="p-3 border-t-2 border-slate-300"></td>
                                    </tr>
                                  );
                                })()}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* 원가 흐름 분석 카드 */}
                      <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">📊 원가 흐름 분석</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                          <div className="bg-slate-50 p-6 rounded-lg border-l-4 border-slate-400">
                            <div className="text-sm text-slate-600 mb-2">현재 총 수량</div>
                            <div className="text-3xl font-semibold text-slate-900">
                              {(() => {
                                const filteredOrders = orders.filter((order: any) => order.order_details?.product_name === '베이직 볼캡');
                                const allItems = filteredOrders.flatMap((order: any) => {
                                  const colors = order.order_details?.colors || {};
                                  return Object.values(colors).map((qty: any) => Number(qty));
                                });
                                const totalQuantity = allItems.reduce((sum, qty) => sum + qty, 0);
                                return totalQuantity;
                              })()}개
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                              {(() => {
                                const filteredOrders = orders.filter((order: any) => order.order_details?.product_name === '베이직 볼캡');
                                const allItems = filteredOrders.flatMap((order: any) => {
                                  const colors = order.order_details?.colors || {};
                                  return Object.entries(colors).map(([color, qty]: [string, any]) => ({ color, qty: Number(qty) }));
                                });
                                const uniqueColors = new Set(allItems.map(item => item.color));
                                const totalQuantity = allItems.reduce((sum, item) => sum + item.qty, 0);
                                const itemsPerColor = totalQuantity / uniqueColors.size;
                                return `${uniqueColors.size}종 × ${itemsPerColor}개`;
                              })()}
                            </div>
                          </div>
                          <div className="bg-slate-50 p-6 rounded-lg border-l-4 border-slate-400">
                            <div className="text-sm text-slate-600 mb-2">현재 원가/개</div>
                            <div className="text-3xl font-semibold text-slate-900">{costPrice.toLocaleString()}원</div>
                            <div className="text-xs text-slate-500 mt-2">자수비 포함</div>
                          </div>
                          <div className="bg-slate-50 p-6 rounded-lg border-l-4 border-slate-400">
                            <div className="text-sm text-slate-600 mb-2">목표 수량 달성 시</div>
                            <div className="text-3xl font-semibold text-slate-900">예상 원가</div>
                            <div className="text-xs text-slate-500 mt-2">50개 기준: 18,500원</div>
                          </div>
                        </div>

                        {/* 수량별 원가 변화 테이블 */}
                        <div className="bg-gray-50 p-6 rounded-lg">
                          <h3 className="text-lg font-semibold text-gray-700 mb-4">수량별 원가 변화</h3>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm">
                              <thead>
                                <tr className="bg-white">
                                  <th className="p-2 text-center border-b border-gray-300">수량</th>
                                  <th className="p-2 text-center border-b border-gray-300">상품가/개</th>
                                  <th className="p-2 text-center border-b border-gray-300">자수비/개</th>
                                  <th className="p-2 text-center border-b border-gray-300">원가/개</th>
                                  <th className="p-2 text-center border-b border-gray-300">마진율</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="bg-orange-50">
                                  <td className="p-2 text-center">20개 (현재)</td>
                                  <td className="p-2 text-center">15,270원</td>
                                  <td className="p-2 text-center">5,000원</td>
                                  <td className="p-2 text-center font-bold">20,270원</td>
                                  <td className="p-2 text-center text-slate-700">48%</td>
                                </tr>
                                <tr>
                                  <td className="p-2 text-center">50개</td>
                                  <td className="p-2 text-center">13,500원</td>
                                  <td className="p-2 text-center">5,000원</td>
                                  <td className="p-2 text-center">18,500원</td>
                                  <td className="p-2 text-center text-slate-700">53%</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      {/* 진행사항 타임라인 및 원가 흐름 분석 */}
                      {orders
                        .filter((order: any) => order.order_details?.product_name === '베이직 볼캡')
                        .map((order: any) => {
                          const orderNumber = order.order_number;
                          const history = progressHistory[orderNumber] || [];
                          if (history.length === 0) return null;
                          
                          return (
                            <div key={order.id} className="space-y-6">
                              <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center justify-between mb-6">
                                  <h2 className="text-xl font-bold text-gray-900">
                                    📋 진행사항 히스토리 (주문번호: {orderNumber})
                                  </h2>
                                  <button
                                    onClick={() => {
                                      setEditingProgress({ order_id: order.id });
                                      setShowProgressFormModal(true);
                                    }}
                                    className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 text-sm font-medium flex items-center space-x-2 transition-colors"
                                  >
                                    <FileText className="h-4 w-4" />
                                    <span>진행사항 추가</span>
                                  </button>
                                </div>
                                <div className="relative">
                                  {history.map((item: any, idx: number) => (
                                    <div key={item.id} className="flex items-start mb-6 last:mb-0">
                                      <div className="flex flex-col items-center mr-4">
                                        <div className={`w-4 h-4 rounded-full ${
                                          idx === history.length - 1 ? 'bg-slate-600' : 'bg-slate-300'
                                        }`} />
                                        {idx < history.length - 1 && (
                                          <div className="w-0.5 h-full bg-gray-300 mt-2" style={{ minHeight: '60px' }} />
                                        )}
                                      </div>
                                      <div className="flex-1 pb-6 last:pb-0">
                                        <div className="flex items-center justify-between">
                                          <div className="flex-1">
                                            <p className="font-semibold text-gray-900">{item.status}</p>
                                            <p className="text-sm text-gray-600 mt-1">{item.status_description}</p>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <span className="text-xs text-gray-500">
                                              {new Date(item.progress_date).toLocaleDateString('ko-KR')}
                                            </span>
                                            <button
                                              onClick={() => {
                                                setEditingProgress(item);
                                                setShowProgressFormModal(true);
                                              }}
                                              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                            >
                                              수정
                                            </button>
                                          </div>
                                        </div>
                                        {item.notes && (
                                          <p className="text-sm text-gray-500 mt-2">{item.notes}</p>
                                        )}
                                        {item.cost_breakdown && Object.keys(item.cost_breakdown).length > 0 && (
                                          <div className="mt-2 text-xs text-gray-600">
                                            <span className="font-semibold">원가 내역: </span>
                                            {Object.entries(item.cost_breakdown)
                                              .filter(([_, v]: [string, any]) => v > 0)
                                              .map(([key, value]: [string, any]) => `${key}: ${Number(value).toLocaleString()}원`)
                                              .join(', ')}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {history.some((item: any) => item.cost_at_stage > 0) && (
                                <div className="bg-white rounded-lg shadow p-6">
                                  <h2 className="text-xl font-bold text-gray-900 mb-6">
                                    💰 원가 흐름 분석 (주문번호: {orderNumber})
                                  </h2>
                                  <div className="space-y-4">
                                    {history
                                      .filter((item: any) => item.cost_at_stage > 0)
                                      .map((item: any, idx: number) => {
                                        const maxCost = Math.max(...history.filter((i: any) => i.cost_at_stage > 0).map((i: any) => i.cost_at_stage));
                                        const percentage = (item.cost_at_stage / maxCost) * 100;
                                        return (
                                          <div key={item.id} className="flex items-center">
                                            <div className="w-32 text-sm text-gray-600">
                                              {new Date(item.progress_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                                            </div>
                                            <div className="flex-1 mx-4">
                                              <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium text-gray-700">{item.status}</span>
                                                <span className="text-sm font-semibold text-gray-900">
                                                  {item.cost_at_stage.toLocaleString()}원
                                                </span>
                                              </div>
                                              <div className="w-full bg-gray-200 rounded-full h-3">
                                                <div
                                                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                                                  style={{ width: `${percentage}%` }}
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                    );
                  })
                ) : (
                  <div className="bg-white rounded-lg shadow p-6 text-center py-12">
                    <p className="text-gray-500">베이직 볼캡 제품을 찾을 수 없습니다.</p>
                    {productsData.length > 0 && (
                      <p className="text-sm text-gray-400 mt-2">제품 데이터: {productsData.map((p: any) => p.name).join(', ')}</p>
                    )}
                  </div>
                )}
              </>
            ) : progressSubTab === 'bucket-hats' ? (
              <>
                {/* 데일리오버 버킷햇 가격 정보 */}
                {productsLoading ? (
                  <div className="bg-white rounded-lg shadow p-6 text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 mx-auto"></div>
                    <p className="mt-4 text-gray-600">데일리오버 버킷햇 데이터를 불러오는 중...</p>
                  </div>
                ) : productsData.length > 0 ? (
                  productsData.filter((p: any) => p.name === '데일리오버 버킷햇' || p.code === 'daily-over-bucket-hat').map((product: any) => {
                    const specs = product.specifications || {};
                    const costPrice = product.base_price + product.embroidery_price; // 원가 (개별단가)
                    const normalPrice = specs.normal_price || 0; // 정상판매가
                    const discountPrice = specs.discount_price || 0; // 할인가
                    const discountRate = specs.discount_rate || 0; // 할인율

                    return (
                      <div key={product.id} className="space-y-6">
                        <div className="bg-white rounded-lg shadow p-6">
                          <h2 className="text-xl font-bold text-gray-900 mb-6">💰 데일리오버 버킷햇 가격 정보</h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg p-6 text-white">
                              <p className="text-sm opacity-90 mb-2">원가 (개별단가)</p>
                              <p className="text-3xl font-bold">{costPrice.toLocaleString()}원</p>
                              <p className="text-xs opacity-90 mt-2">자수비 포함</p>
                            </div>
                            <div className="bg-gradient-to-br from-pink-500 to-pink-700 rounded-lg p-6 text-white">
                              <p className="text-sm opacity-90 mb-2">정상판매가</p>
                              <p className="text-3xl font-bold">{normalPrice.toLocaleString()}원</p>
                              <p className="text-xs opacity-90 mt-2">매장 디스플레이 가격</p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg p-6 text-white">
                              <p className="text-sm opacity-90 mb-2">할인가</p>
                              <p className="text-3xl font-bold">{discountPrice.toLocaleString()}원</p>
                              <p className="text-xs opacity-90 mt-2">실제 판매 가격</p>
                            </div>
                            <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-lg p-6 text-white">
                              <p className="text-sm opacity-90 mb-2">할인율</p>
                              <p className="text-3xl font-bold">{discountRate}%</p>
                              <p className="text-xs opacity-90 mt-2">정상가 대비</p>
                            </div>
                          </div>
                        </div>

                        {/* 최종 제작 제품 테이블 */}
                        <div className="bg-white rounded-lg shadow p-6">
                          <h2 className="text-xl font-bold text-gray-900 mb-6">📦 최종 제작 제품</h2>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm">
                              <thead>
                                <tr className="bg-gray-50 border-b-2 border-gray-200">
                                  <th className="p-3 text-center font-bold">이미지</th>
                                  <th className="p-3 text-left font-bold">제품명</th>
                                  <th className="p-3 text-center font-bold">색상</th>
                                  <th className="p-3 text-center font-bold">수량</th>
                                  <th className="p-3 text-center font-bold">원가/개</th>
                                  <th className="p-3 text-center font-bold">정상가</th>
                                  <th className="p-3 text-center font-bold">할인가</th>
                                  <th className="p-3 text-center font-bold">주문#</th>
                                  <th className="p-3 text-center font-bold">링크</th>
                                </tr>
                              </thead>
                              <tbody>
                                {orders
                                  .filter((order: any) => order.order_details?.product_name === '데일리오버 버킷햇')
                                  .flatMap((order: any) => {
                                    const colors = order.order_details?.colors || {};
                                    return Object.entries(colors).map(([color, qty]: [string, any]) => ({
                                      order,
                                      color,
                                      qty: Number(qty),
                                      colorName: color === 'black' ? '블랙' : '화이트',
                                      imagePath: `/images/products/bucket-hats/photos/bucket-${color}-detail.png`,
                                      marppleUrl: color === 'black' 
                                        ? 'https://www.marpple.com/kr/product/detail?bp_id=2965&pc_id=23579930'
                                        : 'https://www.marpple.com/kr/product/detail?bp_id=2965&pc_id=23579922'
                                    }));
                                  })
                                  .map((item: any, idx: number) => (
                                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                      <td className="p-3 text-center">
                                        <img
                                          src={item.imagePath}
                                          alt={`데일리오버 버킷햇 (${item.colorName})`}
                                          className="w-16 h-16 object-contain mx-auto"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                          }}
                                        />
                                      </td>
                                      <td className="p-3 font-semibold">데일리오버 버킷햇</td>
                                      <td className="p-3 text-center">{item.colorName}</td>
                                      <td className="p-3 text-center">{item.qty}개</td>
                                      <td className="p-3 text-center">{costPrice.toLocaleString()}원</td>
                                      <td className="p-3 text-center">{normalPrice.toLocaleString()}원</td>
                                      <td className="p-3 text-center text-slate-700 font-semibold">{discountPrice.toLocaleString()}원</td>
                                      <td className="p-3 text-center">
                                        <button
                                          onClick={() => handleOrderNumberClick(item.order.order_number)}
                                          className="text-slate-700 hover:text-slate-900 font-semibold cursor-pointer underline transition-colors"
                                        >
                                          {item.order.order_number}
                                        </button>
                                      </td>
                                      <td className="p-3 text-center">
                                        <a
                                          href={item.marppleUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-slate-700 hover:text-slate-900 text-xs transition-colors"
                                        >
                                          보기
                                        </a>
                                      </td>
                                    </tr>
                                  ))}
                                {/* 합계 행 */}
                                {(() => {
                                  const filteredOrders = orders.filter((order: any) => order.order_details?.product_name === '데일리오버 버킷햇');
                                  const allItems = filteredOrders.flatMap((order: any) => {
                                    const colors = order.order_details?.colors || {};
                                    return Object.entries(colors).map(([color, qty]: [string, any]) => ({
                                      color,
                                      qty: Number(qty),
                                      colorName: color === 'black' ? '블랙' : '화이트'
                                    }));
                                  });
                                  const totalQuantity = allItems.reduce((sum, item) => sum + item.qty, 0);
                                  const colorBreakdown = allItems.map(item => `${item.colorName} ${item.qty}개`).join(' + ');
                                  const totalCost = totalQuantity * costPrice;
                                  const totalNormalPrice = totalQuantity * normalPrice;
                                  const totalDiscountPrice = totalQuantity * discountPrice;
                                  
                                  return (
                                    <tr className="bg-slate-50 font-semibold border-t-2 border-slate-300">
                                      <td colSpan={3} className="p-3 text-right border-t-2 border-slate-300">합계</td>
                                      <td className="p-3 text-center border-t-2 border-slate-300 text-slate-900">
                                        {totalQuantity}개
                                        <br />
                                        <small className="font-normal text-gray-500">({colorBreakdown})</small>
                                      </td>
                                      <td className="p-3 text-center border-t-2 border-slate-300 text-slate-700 font-semibold">{totalCost.toLocaleString()}원</td>
                                      <td className="p-3 text-center border-t-2 border-slate-300 text-slate-600">{totalNormalPrice.toLocaleString()}원</td>
                                      <td className="p-3 text-center border-t-2 border-slate-300 text-slate-700">{totalDiscountPrice.toLocaleString()}원</td>
                                      <td colSpan={2} className="p-3 border-t-2 border-slate-300"></td>
                                    </tr>
                                  );
                                })()}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* 원가 흐름 분석 카드 */}
                        <div className="bg-white rounded-lg shadow p-6">
                          <h2 className="text-xl font-bold text-gray-900 mb-6">📊 원가 흐름 분석</h2>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
                              <div className="text-sm text-gray-600 mb-2">현재 총 수량</div>
                              <div className="text-3xl font-bold text-blue-600">
                                {(() => {
                                  const filteredOrders = orders.filter((order: any) => order.order_details?.product_name === '데일리오버 버킷햇');
                                  const allItems = filteredOrders.flatMap((order: any) => {
                                    const colors = order.order_details?.colors || {};
                                    return Object.values(colors).map((qty: any) => Number(qty));
                                  });
                                  return allItems.reduce((sum, qty) => sum + qty, 0);
                                })()}개
                              </div>
                              <div className="text-xs text-gray-500 mt-2">
                                {(() => {
                                  const filteredOrders = orders.filter((order: any) => order.order_details?.product_name === '데일리오버 버킷햇');
                                  const allItems = filteredOrders.flatMap((order: any) => {
                                    const colors = order.order_details?.colors || {};
                                    return Object.entries(colors).map(([color, qty]: [string, any]) => ({
                                      color,
                                      qty: Number(qty),
                                      colorName: color === 'black' ? '블랙' : '화이트'
                                    }));
                                  });
                                  return allItems.map(item => `${item.colorName} ${item.qty}개`).join(' + ');
                                })()}
                              </div>
                            </div>
                            <div className="bg-orange-50 p-6 rounded-lg border-l-4 border-orange-500">
                              <div className="text-sm text-gray-600 mb-2">현재 원가/개</div>
                              <div className="text-3xl font-bold text-orange-600">{costPrice.toLocaleString()}원</div>
                              <div className="text-xs text-gray-500 mt-2">자수비 포함</div>
                            </div>
                            <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
                              <div className="text-sm text-gray-600 mb-2">목표 수량 달성 시</div>
                              <div className="text-3xl font-bold text-green-600">예상 원가</div>
                              <div className="text-xs text-gray-500 mt-2">50개 기준: 23,000원</div>
                            </div>
                          </div>

                          {/* 수량별 원가 변화 테이블 */}
                          <div className="bg-gray-50 p-6 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-700 mb-4">수량별 원가 변화</h3>
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse text-sm">
                                <thead>
                                  <tr className="bg-white">
                                    <th className="p-2 text-center border-b border-gray-300">수량</th>
                                    <th className="p-2 text-center border-b border-gray-300">상품가/개</th>
                                    <th className="p-2 text-center border-b border-gray-300">자수비/개</th>
                                    <th className="p-2 text-center border-b border-gray-300">원가/개</th>
                                    <th className="p-2 text-center border-b border-gray-300">마진율</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className="bg-orange-50">
                                    <td className="p-2 text-center">10개 (현재)</td>
                                    <td className="p-2 text-center">20,600원</td>
                                    <td className="p-2 text-center">5,000원</td>
                                    <td className="p-2 text-center font-bold">25,600원</td>
                                    <td className="p-2 text-center text-slate-700">48%</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2 text-center">50개</td>
                                    <td className="p-2 text-center">18,000원</td>
                                    <td className="p-2 text-center">5,000원</td>
                                    <td className="p-2 text-center">23,000원</td>
                                    <td className="p-2 text-center text-slate-700">53%</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>

                        {/* 진행사항 타임라인 */}
                        {orders
                          .filter((order: any) => order.order_details?.product_name === '데일리오버 버킷햇')
                          .map((order: any) => {
                            const history = progressHistory[order.order_number] || [];
                            if (history.length === 0) return null;
                            
                            return (
                              <div key={order.id} className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">
                                  📋 진행사항 히스토리 (주문번호: {order.order_number})
                                </h2>
                                <div className="relative">
                                  {history.map((item: any, idx: number) => (
                                    <div key={item.id} className="flex items-start mb-6 last:mb-0">
                                      <div className="flex flex-col items-center mr-4">
                                        <div className={`w-4 h-4 rounded-full ${
                                          idx === history.length - 1 ? 'bg-slate-600' : 'bg-slate-300'
                                        }`} />
                                        {idx < history.length - 1 && (
                                          <div className="w-0.5 h-full bg-gray-300 mt-2" style={{ minHeight: '60px' }} />
                                        )}
                                      </div>
                                      <div className="flex-1 pb-6 last:pb-0">
                                        <div className="flex items-center justify-between">
                                          <div className="flex-1">
                                            <p className="font-semibold text-gray-900">{item.status}</p>
                                            <p className="text-sm text-gray-600 mt-1">{item.status_description}</p>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <span className="text-xs text-gray-500">
                                              {new Date(item.progress_date).toLocaleDateString('ko-KR')}
                                            </span>
                                            <button
                                              onClick={() => {
                                                setEditingProgress(item);
                                                setShowProgressFormModal(true);
                                              }}
                                              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                            >
                                              수정
                                            </button>
                                          </div>
                                        </div>
                                        {item.notes && (
                                          <p className="text-sm text-gray-500 mt-2">{item.notes}</p>
                                        )}
                                        {item.cost_breakdown && Object.keys(item.cost_breakdown).length > 0 && (
                                          <div className="mt-2 text-xs text-gray-600">
                                            <span className="font-semibold">원가 내역: </span>
                                            {Object.entries(item.cost_breakdown)
                                              .filter(([_, v]: [string, any]) => v > 0)
                                              .map(([key, value]: [string, any]) => `${key}: ${Number(value).toLocaleString()}원`)
                                              .join(', ')}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}

                        {/* 원가 흐름 분석 차트 */}
                        {orders
                          .filter((order: any) => order.order_details?.product_name === '데일리오버 버킷햇')
                          .map((order: any) => {
                            const history = progressHistory[order.order_number] || [];
                            if (history.length === 0) return null;
                            
                            const costData = history
                              .filter((item: any) => item.cost_at_stage > 0)
                              .map((item: any) => ({
                                date: item.progress_date,
                                cost: item.cost_at_stage,
                                status: item.status
                              }));
                            
                            if (costData.length === 0) return null;
                            
                            const maxCost = Math.max(...costData.map((d: any) => d.cost));
                            
                            return (
                              <div key={order.id} className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">
                                  💰 원가 흐름 분석 (주문번호: {order.order_number})
                                </h2>
                                <div className="space-y-4">
                                  {costData.map((data: any, idx: number) => {
                                    const percentage = (data.cost / maxCost) * 100;
                                    return (
                                      <div key={idx} className="flex items-center">
                                        <div className="w-32 text-sm text-gray-600">
                                          {new Date(data.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                                        </div>
                                        <div className="flex-1 mx-4">
                                          <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-700">{data.status}</span>
                                            <span className="text-sm font-semibold text-gray-900">
                                              {data.cost.toLocaleString()}원
                                            </span>
                                          </div>
                                          <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                                              style={{ width: `${percentage}%` }}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-white rounded-lg shadow p-6 text-center py-12">
                    <p className="text-gray-500">데일리오버 버킷햇 제품을 찾을 수 없습니다.</p>
                    {productsData.length > 0 && (
                      <p className="text-sm text-gray-400 mt-2">제품 데이터: {productsData.map((p: any) => p.name).join(', ')}</p>
                    )}
                  </div>
                )}
              </>
            ) : progressSubTab === 'pouches' ? (
              <>
                {/* 가죽 클러치백 가격 정보 */}
                {productsLoading ? (
                  <div className="bg-white rounded-lg shadow p-6 text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 mx-auto"></div>
                    <p className="mt-4 text-gray-600">가죽 클러치백 데이터를 불러오는 중...</p>
                  </div>
                ) : productsData.length > 0 ? (
                  productsData.filter((p: any) => p.name === '가죽 클러치백' || p.code === 'leather-pouch').map((product: any) => {
                    const specs = product.specifications || {};
                    const costPrice = product.base_price + product.embroidery_price; // 원가 (개별단가)
                    const normalPrice = specs.normal_price || 0; // 정상판매가
                    const discountPrice = specs.discount_price || 0; // 할인가
                    const discountRate = specs.discount_rate || 0; // 할인율

                    return (
                      <div key={product.id} className="space-y-6">
                        <div className="bg-white rounded-lg shadow p-6">
                          <h2 className="text-xl font-bold text-gray-900 mb-6">💰 가죽 클러치백 가격 정보</h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg p-6 text-white">
                              <p className="text-sm opacity-90 mb-2">원가 (개별단가)</p>
                              <p className="text-3xl font-bold">{costPrice.toLocaleString()}원</p>
                              <p className="text-xs opacity-90 mt-2">자수비 없음</p>
                            </div>
                            <div className="bg-gradient-to-br from-pink-500 to-pink-700 rounded-lg p-6 text-white">
                              <p className="text-sm opacity-90 mb-2">정상판매가</p>
                              <p className="text-3xl font-bold">{normalPrice.toLocaleString()}원</p>
                              <p className="text-xs opacity-90 mt-2">매장 디스플레이 가격</p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg p-6 text-white">
                              <p className="text-sm opacity-90 mb-2">할인가</p>
                              <p className="text-3xl font-bold">{discountPrice.toLocaleString()}원</p>
                              <p className="text-xs opacity-90 mt-2">실제 판매 가격</p>
                            </div>
                            <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-lg p-6 text-white">
                              <p className="text-sm opacity-90 mb-2">할인율</p>
                              <p className="text-3xl font-bold">{discountRate}%</p>
                              <p className="text-xs opacity-90 mt-2">정상가 대비</p>
                            </div>
                          </div>
                        </div>

                        {/* 최종 제작 제품 테이블 */}
                        <div className="bg-white rounded-lg shadow p-6">
                          <h2 className="text-xl font-bold text-gray-900 mb-6">📦 최종 제작 제품</h2>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm">
                              <thead>
                                <tr className="bg-gray-50 border-b-2 border-gray-200">
                                  <th className="p-3 text-center font-bold">이미지</th>
                                  <th className="p-3 text-left font-bold">제품명</th>
                                  <th className="p-3 text-center font-bold">색상</th>
                                  <th className="p-3 text-center font-bold">수량</th>
                                  <th className="p-3 text-center font-bold">원가/개</th>
                                  <th className="p-3 text-center font-bold">정상가</th>
                                  <th className="p-3 text-center font-bold">할인가</th>
                                  <th className="p-3 text-center font-bold">주문#</th>
                                  <th className="p-3 text-center font-bold">링크</th>
                                </tr>
                              </thead>
                              <tbody>
                                {orders
                                  .filter((order: any) => order.order_details?.product_name === '가죽 클러치백')
                                  .map((order: any, idx: number) => {
                                    const orderDetails = order.order_details || {};
                                    const productName = orderDetails.product_name || '가죽 클러치백';
                                    const color = orderDetails.color || 'white';
                                    const colorName = color === 'white' ? '화이트' : color;
                                    const quantity = order.quantity || 0;
                                    const imagePath = idx === 0 
                                      ? '/images/products/pouches/photos/pouch-1-front-detail.png'
                                      : '/images/products/pouches/photos/pouch-2-front-detail.png';
                                    const marppleUrl = idx === 0
                                      ? 'https://www.marpple.com/kr/product/detail?bp_id=4934&pc_id=23576122'
                                      : 'https://www.marpple.com/kr/product/detail?bp_id=4934&pc_id=23576111';
                                    const orderNumber = idx === 0 ? '19571501' : '19571413';

                                    return (
                                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="p-3 text-center">
                                          <img
                                            src={imagePath}
                                            alt={`${productName} (${colorName})`}
                                            className="w-16 h-16 object-contain mx-auto"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                          />
                                        </td>
                                        <td className="p-3 font-semibold">{idx === 0 ? '가죽 클러치백 (파우치 1)' : '가죽 클러치백 2'}</td>
                                        <td className="p-3 text-center">{colorName}</td>
                                        <td className="p-3 text-center">{quantity}개</td>
                                        <td className="p-3 text-center">{costPrice.toLocaleString()}원</td>
                                        <td className="p-3 text-center">{normalPrice.toLocaleString()}원</td>
                                        <td className="p-3 text-center text-slate-700 font-semibold">{discountPrice.toLocaleString()}원</td>
                                        <td className="p-3 text-center">
                                          <button
                                            onClick={() => handleOrderNumberClick(orderNumber)}
                                            className="text-slate-700 hover:text-slate-900 font-semibold cursor-pointer underline transition-colors"
                                          >
                                            {orderNumber}
                                          </button>
                                        </td>
                                        <td className="p-3 text-center">
                                          <a
                                            href={marppleUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-slate-700 hover:text-slate-900 text-xs transition-colors"
                                          >
                                            보기
                                          </a>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                {/* 합계 행 */}
                                {(() => {
                                  const filteredOrders = orders.filter((order: any) => order.order_details?.product_name === '가죽 클러치백');
                                  const totalQuantity = filteredOrders.reduce((sum, order) => sum + (order.quantity || 0), 0);
                                  const totalCost = totalQuantity * costPrice;
                                  const totalNormalPrice = totalQuantity * normalPrice;
                                  const totalDiscountPrice = totalQuantity * discountPrice;
                                  
                                  return (
                                    <tr className="bg-slate-50 font-semibold border-t-2 border-slate-300">
                                      <td colSpan={3} className="p-3 text-right border-t-2 border-slate-300">합계</td>
                                      <td className="p-3 text-center border-t-2 border-slate-300 text-slate-900">
                                        {totalQuantity}개
                                        <br />
                                        <small className="font-normal text-gray-500">(디자인 2종)</small>
                                      </td>
                                      <td className="p-3 text-center border-t-2 border-slate-300 text-slate-700 font-semibold">{totalCost.toLocaleString()}원</td>
                                      <td className="p-3 text-center border-t-2 border-slate-300 text-slate-600">{totalNormalPrice.toLocaleString()}원</td>
                                      <td className="p-3 text-center border-t-2 border-slate-300 text-slate-700">{totalDiscountPrice.toLocaleString()}원</td>
                                      <td colSpan={2} className="p-3 border-t-2 border-slate-300"></td>
                                    </tr>
                                  );
                                })()}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* 원가 흐름 분석 카드 */}
                        <div className="bg-white rounded-lg shadow p-6">
                          <h2 className="text-xl font-bold text-gray-900 mb-6">📊 원가 흐름 분석</h2>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
                              <div className="text-sm text-gray-600 mb-2">현재 총 수량</div>
                              <div className="text-3xl font-bold text-blue-600">
                                {(() => {
                                  const filteredOrders = orders.filter((order: any) => order.order_details?.product_name === '가죽 클러치백');
                                  return filteredOrders.reduce((sum, order) => sum + (order.quantity || 0), 0);
                                })()}개
                              </div>
                              <div className="text-xs text-gray-500 mt-2">디자인 2종</div>
                            </div>
                            <div className="bg-orange-50 p-6 rounded-lg border-l-4 border-orange-500">
                              <div className="text-sm text-gray-600 mb-2">현재 원가/개</div>
                              <div className="text-3xl font-bold text-orange-600">{costPrice.toLocaleString()}원</div>
                              <div className="text-xs text-gray-500 mt-2">자수비 없음</div>
                            </div>
                            <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
                              <div className="text-sm text-gray-600 mb-2">목표 수량 달성 시</div>
                              <div className="text-3xl font-bold text-green-600">예상 원가</div>
                              <div className="text-xs text-gray-500 mt-2">20개 기준: 22,000원</div>
                            </div>
                          </div>

                          {/* 수량별 원가 변화 테이블 */}
                          <div className="bg-gray-50 p-6 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-700 mb-4">수량별 원가 변화</h3>
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse text-sm">
                                <thead>
                                  <tr className="bg-white">
                                    <th className="p-2 text-center border-b border-gray-300">수량</th>
                                    <th className="p-2 text-center border-b border-gray-300">상품가/개</th>
                                    <th className="p-2 text-center border-b border-gray-300">자수비/개</th>
                                    <th className="p-2 text-center border-b border-gray-300">원가/개</th>
                                    <th className="p-2 text-center border-b border-gray-300">마진율</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className="bg-orange-50">
                                    <td className="p-2 text-center">4개 (현재)</td>
                                    <td className="p-2 text-center">24,000원</td>
                                    <td className="p-2 text-center">0원</td>
                                    <td className="p-2 text-center font-bold">24,000원</td>
                                    <td className="p-2 text-center text-green-600">65%</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2 text-center">20개</td>
                                    <td className="p-2 text-center">22,000원</td>
                                    <td className="p-2 text-center">0원</td>
                                    <td className="p-2 text-center">22,000원</td>
                                    <td className="p-2 text-center text-green-600">68%</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>

                        {/* 진행사항 타임라인 */}
                        {orders
                          .filter((order: any) => order.order_details?.product_name === '가죽 클러치백')
                          .map((order: any) => {
                            const orderNumber = order.order_number;
                            const history = progressHistory[orderNumber] || [];
                            if (history.length === 0) return null;
                            
                            return (
                              <div key={order.id} className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">
                                  📋 진행사항 히스토리 (주문번호: {orderNumber})
                                </h2>
                                <div className="relative">
                                  {history.map((item: any, idx: number) => (
                                    <div key={item.id} className="flex items-start mb-6 last:mb-0">
                                      <div className="flex flex-col items-center mr-4">
                                        <div className={`w-4 h-4 rounded-full ${
                                          idx === history.length - 1 ? 'bg-slate-600' : 'bg-slate-300'
                                        }`} />
                                        {idx < history.length - 1 && (
                                          <div className="w-0.5 h-full bg-gray-300 mt-2" style={{ minHeight: '60px' }} />
                                        )}
                                      </div>
                                      <div className="flex-1 pb-6 last:pb-0">
                                        <div className="flex items-center justify-between">
                                          <div className="flex-1">
                                            <p className="font-semibold text-gray-900">{item.status}</p>
                                            <p className="text-sm text-gray-600 mt-1">{item.status_description}</p>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <span className="text-xs text-gray-500">
                                              {new Date(item.progress_date).toLocaleDateString('ko-KR')}
                                            </span>
                                            <button
                                              onClick={() => {
                                                setEditingProgress(item);
                                                setShowProgressFormModal(true);
                                              }}
                                              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                            >
                                              수정
                                            </button>
                                          </div>
                                        </div>
                                        {item.notes && (
                                          <p className="text-sm text-gray-500 mt-2">{item.notes}</p>
                                        )}
                                        {item.cost_breakdown && Object.keys(item.cost_breakdown).length > 0 && (
                                          <div className="mt-2 text-xs text-gray-600">
                                            <span className="font-semibold">원가 내역: </span>
                                            {Object.entries(item.cost_breakdown)
                                              .filter(([_, v]: [string, any]) => v > 0)
                                              .map(([key, value]: [string, any]) => `${key}: ${Number(value).toLocaleString()}원`)
                                              .join(', ')}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}

                        {/* 원가 흐름 분석 차트 */}
                        {orders
                          .filter((order: any) => order.order_details?.product_name === '가죽 클러치백')
                          .map((order: any) => {
                            const orderNumber = order.order_number;
                            const history = progressHistory[orderNumber] || [];
                            if (history.length === 0) return null;
                            
                            const costData = history
                              .filter((item: any) => item.cost_at_stage > 0)
                              .map((item: any) => ({
                                date: item.progress_date,
                                cost: item.cost_at_stage,
                                status: item.status
                              }));
                            
                            if (costData.length === 0) return null;
                            
                            const maxCost = Math.max(...costData.map((d: any) => d.cost));
                            
                            return (
                              <div key={order.id} className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">
                                  💰 원가 흐름 분석 (주문번호: {orderNumber})
                                </h2>
                                <div className="space-y-4">
                                  {costData.map((data: any, idx: number) => {
                                    const percentage = (data.cost / maxCost) * 100;
                                    return (
                                      <div key={idx} className="flex items-center">
                                        <div className="w-32 text-sm text-gray-600">
                                          {new Date(data.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                                        </div>
                                        <div className="flex-1 mx-4">
                                          <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-700">{data.status}</span>
                                            <span className="text-sm font-semibold text-gray-900">
                                              {data.cost.toLocaleString()}원
                                            </span>
                                          </div>
                                          <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                                              style={{ width: `${percentage}%` }}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-white rounded-lg shadow p-6 text-center py-12">
                    <p className="text-gray-500">가죽 클러치백 제품을 찾을 수 없습니다.</p>
                    {productsData.length > 0 && (
                      <p className="text-sm text-gray-400 mt-2">제품 데이터: {productsData.map((p: any) => p.name).join(', ')}</p>
                    )}
                  </div>
                )}
              </>
            ) : progressSubTab === 't-shirts' ? (
              <>
                {/* 페어플레이 더블코튼 무지 티셔츠 가격 정보 */}
                {productsLoading ? (
                  <div className="bg-white rounded-lg shadow p-6 text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 mx-auto"></div>
                    <p className="mt-4 text-gray-600">페어플레이 더블코튼 무지 티셔츠 데이터를 불러오는 중...</p>
                  </div>
                ) : productsData.length > 0 ? (
                  productsData.filter((p: any) => p.name === '페어플레이 더블코튼 무지 티셔츠' || p.code === 'fairplay-double-cotton-tee').map((product: any) => {
                    const specs = product.specifications || {};
                    const costPrice = product.base_price + product.embroidery_price; // 원가 (개별단가)
                    const normalPrice = specs.normal_price || 0; // 정상판매가
                    const discountPrice = specs.discount_price || 0; // 할인가
                    const discountRate = specs.discount_rate || 0; // 할인율

                    return (
                      <div key={product.id} className="space-y-6">
                        <div className="bg-white rounded-lg shadow p-6">
                          <h2 className="text-xl font-bold text-gray-900 mb-6">💰 페어플레이 더블코튼 무지 티셔츠 가격 정보</h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg p-6 text-white">
                              <p className="text-sm opacity-90 mb-2">원가 (개별단가)</p>
                              <p className="text-3xl font-bold">{costPrice.toLocaleString()}원</p>
                              <p className="text-xs opacity-90 mt-2">자수비 없음</p>
                            </div>
                            <div className="bg-gradient-to-br from-pink-500 to-pink-700 rounded-lg p-6 text-white">
                              <p className="text-sm opacity-90 mb-2">정상판매가</p>
                              <p className="text-3xl font-bold">{normalPrice.toLocaleString()}원</p>
                              <p className="text-xs opacity-90 mt-2">매장 디스플레이 가격</p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg p-6 text-white">
                              <p className="text-sm opacity-90 mb-2">할인가</p>
                              <p className="text-3xl font-bold">{discountPrice.toLocaleString()}원</p>
                              <p className="text-xs opacity-90 mt-2">실제 판매 가격</p>
                            </div>
                            <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-lg p-6 text-white">
                              <p className="text-sm opacity-90 mb-2">할인율</p>
                              <p className="text-3xl font-bold">{discountRate}%</p>
                              <p className="text-xs opacity-90 mt-2">정상가 대비</p>
                            </div>
                          </div>
                        </div>

                        {/* 최종 제작 제품 테이블 */}
                        <div className="bg-white rounded-lg shadow p-6">
                          <h2 className="text-xl font-bold text-gray-900 mb-6">📦 최종 제작 제품</h2>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm">
                              <thead>
                                <tr className="bg-gray-50 border-b-2 border-gray-200">
                                  <th className="p-3 text-center font-bold">이미지</th>
                                  <th className="p-3 text-left font-bold">제품명</th>
                                  <th className="p-3 text-center font-bold">색상</th>
                                  <th className="p-3 text-center font-bold">수량</th>
                                  <th className="p-3 text-center font-bold">원가/개</th>
                                  <th className="p-3 text-center font-bold">정상가</th>
                                  <th className="p-3 text-center font-bold">할인가</th>
                                  <th className="p-3 text-center font-bold">주문#</th>
                                  <th className="p-3 text-center font-bold">링크</th>
                                </tr>
                              </thead>
                              <tbody>
                                {orders
                                  .filter((order: any) => order.order_details?.product_name === '페어플레이 더블코튼 무지 티셔츠')
                                  .map((order: any) => {
                                    const orderDetails = order.order_details || {};
                                    const color = orderDetails.color || 'white';
                                    const colorName = color === 'white' ? '화이트' : color;
                                    const size = orderDetails.size || 'L';

                                    return (
                                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="p-3 text-center">
                                          <img
                                            src="/images/products/t-shirts/photos/tee-detail.png"
                                            alt="페어플레이 더블코튼 무지 티셔츠"
                                            className="w-16 h-16 object-contain mx-auto"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                          />
                                        </td>
                                        <td className="p-3 font-semibold">페어플레이 더블코튼 무지 티셔츠</td>
                                        <td className="p-3 text-center">{colorName}</td>
                                        <td className="p-3 text-center">{order.quantity}개</td>
                                        <td className="p-3 text-center">{costPrice.toLocaleString()}원</td>
                                        <td className="p-3 text-center">{normalPrice.toLocaleString()}원</td>
                                        <td className="p-3 text-center text-slate-700 font-semibold">{discountPrice.toLocaleString()}원</td>
                                        <td className="p-3 text-center">
                                          <button
                                            onClick={() => handleOrderNumberClick('19570464')}
                                            className="text-slate-700 hover:text-slate-900 font-semibold cursor-pointer underline transition-colors"
                                          >
                                            19570464
                                          </button>
                                        </td>
                                        <td className="p-3 text-center">
                                          <a
                                            href="https://www.marpple.com/kr/product/detail?bp_id=4669&pc_id=23575056"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-slate-700 hover:text-slate-900 text-xs transition-colors"
                                          >
                                            보기
                                          </a>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                {/* 합계 행 */}
                                {(() => {
                                  const filteredOrders = orders.filter((order: any) => order.order_details?.product_name === '페어플레이 더블코튼 무지 티셔츠');
                                  const totalQuantity = filteredOrders.reduce((sum, order) => sum + (order.quantity || 0), 0);
                                  const totalCost = totalQuantity * costPrice;
                                  const totalNormalPrice = totalQuantity * normalPrice;
                                  const totalDiscountPrice = totalQuantity * discountPrice;
                                  
                                  return (
                                    <tr className="bg-slate-50 font-semibold border-t-2 border-slate-300">
                                      <td colSpan={3} className="p-3 text-right border-t-2 border-slate-300">합계</td>
                                      <td className="p-3 text-center border-t-2 border-slate-300 text-slate-900">
                                        {totalQuantity}개
                                        <br />
                                        <small className="font-normal text-gray-500">(L 사이즈)</small>
                                      </td>
                                      <td className="p-3 text-center border-t-2 border-slate-300 text-slate-700 font-semibold">{totalCost.toLocaleString()}원</td>
                                      <td className="p-3 text-center border-t-2 border-slate-300 text-slate-600">{totalNormalPrice.toLocaleString()}원</td>
                                      <td className="p-3 text-center border-t-2 border-slate-300 text-slate-700">{totalDiscountPrice.toLocaleString()}원</td>
                                      <td colSpan={2} className="p-3 border-t-2 border-slate-300"></td>
                                    </tr>
                                  );
                                })()}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* 원가 흐름 분석 카드 */}
                        <div className="bg-white rounded-lg shadow p-6">
                          <h2 className="text-xl font-bold text-gray-900 mb-6">📊 원가 흐름 분석</h2>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
                              <div className="text-sm text-gray-600 mb-2">현재 총 수량</div>
                              <div className="text-3xl font-bold text-blue-600">
                                {(() => {
                                  const filteredOrders = orders.filter((order: any) => order.order_details?.product_name === '페어플레이 더블코튼 무지 티셔츠');
                                  return filteredOrders.reduce((sum, order) => sum + (order.quantity || 0), 0);
                                })()}개
                              </div>
                              <div className="text-xs text-gray-500 mt-2">화이트 L</div>
                            </div>
                            <div className="bg-orange-50 p-6 rounded-lg border-l-4 border-orange-500">
                              <div className="text-sm text-gray-600 mb-2">현재 원가/개</div>
                              <div className="text-3xl font-bold text-orange-600">{costPrice.toLocaleString()}원</div>
                              <div className="text-xs text-gray-500 mt-2">자수비 없음</div>
                            </div>
                            <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
                              <div className="text-sm text-gray-600 mb-2">목표 수량 달성 시</div>
                              <div className="text-3xl font-bold text-green-600">예상 원가</div>
                              <div className="text-xs text-gray-500 mt-2">20개 기준: 22,000원</div>
                            </div>
                          </div>

                          {/* 수량별 원가 변화 테이블 */}
                          <div className="bg-gray-50 p-6 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-700 mb-4">수량별 원가 변화</h3>
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse text-sm">
                                <thead>
                                  <tr className="bg-white">
                                    <th className="p-2 text-center border-b border-gray-300">수량</th>
                                    <th className="p-2 text-center border-b border-gray-300">상품가/개</th>
                                    <th className="p-2 text-center border-b border-gray-300">자수비/개</th>
                                    <th className="p-2 text-center border-b border-gray-300">원가/개</th>
                                    <th className="p-2 text-center border-b border-gray-300">마진율</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className="bg-orange-50">
                                    <td className="p-2 text-center">2개 (현재)</td>
                                    <td className="p-2 text-center">24,900원</td>
                                    <td className="p-2 text-center">0원</td>
                                    <td className="p-2 text-center font-bold">24,900원</td>
                                    <td className="p-2 text-center text-green-600">49%</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2 text-center">20개</td>
                                    <td className="p-2 text-center">22,000원</td>
                                    <td className="p-2 text-center">0원</td>
                                    <td className="p-2 text-center">22,000원</td>
                                    <td className="p-2 text-center text-green-600">55%</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>

                        {/* 진행사항 타임라인 및 원가 흐름 분석 */}
                        {(() => {
                          const orderNumber = '19570464';
                          const history = progressHistory[orderNumber] || [];
                          if (history.length === 0) return null;
                          
                          return (
                            <>
                              <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center justify-between mb-6">
                                  <h2 className="text-xl font-bold text-gray-900">
                                    📋 진행사항 히스토리 (주문번호: {orderNumber})
                                  </h2>
                                  <button
                                    onClick={() => {
                                      setEditingProgress({ order_id: order.id });
                                      setShowProgressFormModal(true);
                                    }}
                                    className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 text-sm font-medium flex items-center space-x-2 transition-colors"
                                  >
                                    <FileText className="h-4 w-4" />
                                    <span>진행사항 추가</span>
                                  </button>
                                </div>
                                <div className="relative">
                                  {history.map((item: any, idx: number) => (
                                    <div key={item.id} className="flex items-start mb-6 last:mb-0">
                                      <div className="flex flex-col items-center mr-4">
                                        <div className={`w-4 h-4 rounded-full ${
                                          idx === history.length - 1 ? 'bg-slate-600' : 'bg-slate-300'
                                        }`} />
                                        {idx < history.length - 1 && (
                                          <div className="w-0.5 h-full bg-gray-300 mt-2" style={{ minHeight: '60px' }} />
                                        )}
                                      </div>
                                      <div className="flex-1 pb-6 last:pb-0">
                                        <div className="flex items-center justify-between">
                                          <div className="flex-1">
                                            <p className="font-semibold text-gray-900">{item.status}</p>
                                            <p className="text-sm text-gray-600 mt-1">{item.status_description}</p>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <span className="text-xs text-gray-500">
                                              {new Date(item.progress_date).toLocaleDateString('ko-KR')}
                                            </span>
                                            <button
                                              onClick={() => {
                                                setEditingProgress(item);
                                                setShowProgressFormModal(true);
                                              }}
                                              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                            >
                                              수정
                                            </button>
                                          </div>
                                        </div>
                                        {item.notes && (
                                          <p className="text-sm text-gray-500 mt-2">{item.notes}</p>
                                        )}
                                        {item.cost_breakdown && Object.keys(item.cost_breakdown).length > 0 && (
                                          <div className="mt-2 text-xs text-gray-600">
                                            <span className="font-semibold">원가 내역: </span>
                                            {Object.entries(item.cost_breakdown)
                                              .filter(([_, v]: [string, any]) => v > 0)
                                              .map(([key, value]: [string, any]) => `${key}: ${Number(value).toLocaleString()}원`)
                                              .join(', ')}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {history.some((item: any) => item.cost_at_stage > 0) && (
                                <div className="bg-white rounded-lg shadow p-6">
                                  <h2 className="text-xl font-bold text-gray-900 mb-6">
                                    💰 원가 흐름 분석 (주문번호: {orderNumber})
                                  </h2>
                                  <div className="space-y-4">
                                    {history
                                      .filter((item: any) => item.cost_at_stage > 0)
                                      .map((item: any, idx: number) => {
                                        const maxCost = Math.max(...history.filter((i: any) => i.cost_at_stage > 0).map((i: any) => i.cost_at_stage));
                                        const percentage = (item.cost_at_stage / maxCost) * 100;
                                        return (
                                          <div key={item.id} className="flex items-center">
                                            <div className="w-32 text-sm text-gray-600">
                                              {new Date(item.progress_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                                            </div>
                                            <div className="flex-1 mx-4">
                                              <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium text-gray-700">{item.status}</span>
                                                <span className="text-sm font-semibold text-gray-900">
                                                  {item.cost_at_stage.toLocaleString()}원
                                                </span>
                                              </div>
                                              <div className="w-full bg-gray-200 rounded-full h-3">
                                                <div
                                                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                                                  style={{ width: `${percentage}%` }}
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-white rounded-lg shadow p-6 text-center py-12">
                    <p className="text-gray-500">페어플레이 더블코튼 무지 티셔츠 제품을 찾을 수 없습니다.</p>
                    {productsData.length > 0 && (
                      <p className="text-sm text-gray-400 mt-2">제품 데이터: {productsData.map((p: any) => p.name).join(', ')}</p>
                    )}
                  </div>
                )}
              </>
            ) : progressSubTab === 'sweatshirts' ? (
              <>
                {/* 특양면 헤리 맨투맨 가격 정보 */}
                {productsLoading ? (
                  <div className="bg-white rounded-lg shadow p-6 text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 mx-auto"></div>
                    <p className="mt-4 text-gray-600">특양면 헤리 맨투맨 데이터를 불러오는 중...</p>
                  </div>
                ) : productsData.length > 0 ? (
                  productsData.filter((p: any) => p.name === '특양면 헤리 맨투맨 (남녀공용)' || p.code === 'heavyweight-harry-sweatshirt').map((product: any) => {
                    const specs = product.specifications || {};
                    const costPrice = product.base_price + product.embroidery_price; // 원가 (평균단가)
                    const normalPrice = specs.normal_price || 0; // 정상판매가
                    const discountPrice = specs.discount_price || 0; // 할인가
                    const discountRate = specs.discount_rate || 0; // 할인율

                    return (
                      <div key={product.id} className="space-y-6">
                        <div className="bg-white rounded-lg shadow p-6">
                          <h2 className="text-xl font-bold text-gray-900 mb-6">💰 특양면 헤리 맨투맨 가격 정보</h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg p-6 text-white">
                              <p className="text-sm opacity-90 mb-2">원가 (평균단가)</p>
                              <p className="text-3xl font-bold">{costPrice.toLocaleString()}원</p>
                              <p className="text-xs opacity-90 mt-2">인쇄비 포함</p>
                            </div>
                            <div className="bg-gradient-to-br from-pink-500 to-pink-700 rounded-lg p-6 text-white">
                              <p className="text-sm opacity-90 mb-2">정상판매가</p>
                              <p className="text-3xl font-bold">{normalPrice.toLocaleString()}원</p>
                              <p className="text-xs opacity-90 mt-2">매장 디스플레이 가격</p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg p-6 text-white">
                              <p className="text-sm opacity-90 mb-2">할인가</p>
                              <p className="text-3xl font-bold">{discountPrice.toLocaleString()}원</p>
                              <p className="text-xs opacity-90 mt-2">실제 판매 가격</p>
                            </div>
                            <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-lg p-6 text-white">
                              <p className="text-sm opacity-90 mb-2">할인율</p>
                              <p className="text-3xl font-bold">{discountRate}%</p>
                              <p className="text-xs opacity-90 mt-2">정상가 대비</p>
                            </div>
                          </div>
                        </div>

                        {/* 최종 제작 제품 테이블 */}
                        <div className="bg-white rounded-lg shadow p-6">
                          <h2 className="text-xl font-bold text-gray-900 mb-6">📦 최종 제작 제품</h2>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm">
                              <thead>
                                <tr className="bg-gray-50 border-b-2 border-gray-200">
                                  <th className="p-3 text-center font-bold">이미지</th>
                                  <th className="p-3 text-left font-bold">제품명</th>
                                  <th className="p-3 text-center font-bold">색상</th>
                                  <th className="p-3 text-center font-bold">수량</th>
                                  <th className="p-3 text-center font-bold">원가/개</th>
                                  <th className="p-3 text-center font-bold">정상가</th>
                                  <th className="p-3 text-center font-bold">할인가</th>
                                  <th className="p-3 text-center font-bold">주문#</th>
                                  <th className="p-3 text-center font-bold">링크</th>
                                </tr>
                              </thead>
                              <tbody>
                                {orders
                                  .filter((order: any) => order.order_details?.product_name === '특양면 헤리 맨투맨 (남녀공용)')
                                  .flatMap((order: any) => {
                                    const colors = order.order_details?.colors || {};
                                    return Object.entries(colors).map(([color, data]: [string, any]) => {
                                      const qty = typeof data === 'object' ? (data.quantity || 0) : Number(data || 0);
                                      const colorName = color === 'ivory' ? '아이보리' : color === 'black' ? '검정' : color;
                                      return {
                                        order,
                                        color,
                                        qty,
                                        colorName
                                      };
                                    });
                                  })
                                  .map((item: any, idx: number) => (
                                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                      <td className="p-3 text-center">
                                        <img
                                          src="/images/products/sweatshirts/marpple/sweatshirt-3165.webp"
                                          alt={`특양면 헤리 맨투맨 (${item.colorName})`}
                                          className="w-16 h-16 object-contain mx-auto"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                          }}
                                        />
                                      </td>
                                      <td className="p-3 font-semibold">특양면 헤리 맨투맨 (남녀공용)</td>
                                      <td className="p-3 text-center">{item.colorName}</td>
                                      <td className="p-3 text-center">{item.qty}개</td>
                                      <td className="p-3 text-center">{costPrice.toLocaleString()}원</td>
                                      <td className="p-3 text-center">{normalPrice.toLocaleString()}원</td>
                                      <td className="p-3 text-center text-slate-700 font-semibold">{discountPrice.toLocaleString()}원</td>
                                      <td className="p-3 text-center">
                                        <button
                                          onClick={() => handleOrderNumberClick(item.order.order_number)}
                                          className="text-slate-700 hover:text-slate-900 font-semibold cursor-pointer underline transition-colors"
                                        >
                                          {item.order.order_number}
                                        </button>
                                      </td>
                                      <td className="p-3 text-center">
                                        <a
                                          href={`https://www.marpple.com/kr/order/detail/${item.order.order_number}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-slate-700 hover:text-slate-900 text-xs transition-colors"
                                        >
                                          보기
                                        </a>
                                      </td>
                                    </tr>
                                  ))}
                                {/* 합계 행 */}
                                {(() => {
                                  const filteredOrders = orders.filter((order: any) => order.order_details?.product_name === '특양면 헤리 맨투맨 (남녀공용)');
                                  const allItems = filteredOrders.flatMap((order: any) => {
                                    const colors = order.order_details?.colors || {};
                                    return Object.entries(colors).map(([color, data]: [string, any]) => {
                                      const qty = typeof data === 'object' ? (data.quantity || 0) : Number(data || 0);
                                      const colorName = color === 'ivory' ? '아이보리' : color === 'black' ? '검정' : color;
                                      return { color, qty, colorName };
                                    });
                                  });
                                  const totalQuantity = allItems.reduce((sum, item) => sum + item.qty, 0);
                                  const colorBreakdown = allItems.map(item => `${item.colorName} ${item.qty}개`).join(', ');
                                  const totalCost = totalQuantity * costPrice;
                                  const totalNormalPrice = totalQuantity * normalPrice;
                                  const totalDiscountPrice = totalQuantity * discountPrice;
                                  
                                  return (
                                    <tr className="bg-slate-50 font-semibold border-t-2 border-slate-300">
                                      <td colSpan={3} className="p-3 text-right border-t-2 border-slate-300">합계</td>
                                      <td className="p-3 text-center border-t-2 border-slate-300 text-slate-900">
                                        {totalQuantity}개
                                        <br />
                                        <small className="font-normal text-gray-500">({colorBreakdown})</small>
                                      </td>
                                      <td className="p-3 text-center border-t-2 border-slate-300 text-slate-700 font-semibold">{totalCost.toLocaleString()}원</td>
                                      <td className="p-3 text-center border-t-2 border-slate-300 text-slate-600">{totalNormalPrice.toLocaleString()}원</td>
                                      <td className="p-3 text-center border-t-2 border-slate-300 text-slate-700">{totalDiscountPrice.toLocaleString()}원</td>
                                      <td colSpan={2} className="p-3 border-t-2 border-slate-300"></td>
                                    </tr>
                                  );
                                })()}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* 원가 흐름 분석 카드 */}
                        <div className="bg-white rounded-lg shadow p-6">
                          <h2 className="text-xl font-bold text-gray-900 mb-6">📊 원가 흐름 분석</h2>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
                              <div className="text-sm text-gray-600 mb-2">현재 총 수량</div>
                              <div className="text-3xl font-bold text-blue-600">
                                {(() => {
                                  const filteredOrders = orders.filter((order: any) => order.order_details?.product_name === '특양면 헤리 맨투맨 (남녀공용)');
                                  const allItems = filteredOrders.flatMap((order: any) => {
                                    const colors = order.order_details?.colors || {};
                                    return Object.values(colors).map((data: any) => {
                                      const qty = typeof data === 'object' ? (data.quantity || 0) : Number(data || 0);
                                      return qty;
                                    });
                                  });
                                  return allItems.reduce((sum, qty) => sum + qty, 0);
                                })()}개
                              </div>
                              <div className="text-xs text-gray-500 mt-2">
                                {(() => {
                                  const filteredOrders = orders.filter((order: any) => order.order_details?.product_name === '특양면 헤리 맨투맨 (남녀공용)');
                                  const allItems = filteredOrders.flatMap((order: any) => {
                                    const colors = order.order_details?.colors || {};
                                    return Object.entries(colors).map(([color, data]: [string, any]) => {
                                      const qty = typeof data === 'object' ? (data.quantity || 0) : Number(data || 0);
                                      const colorName = color === 'ivory' ? '아이보리' : color === 'black' ? '검정' : color;
                                      return { colorName, qty };
                                    });
                                  });
                                  return allItems.map(item => `${item.colorName} ${item.qty}개`).join(', ');
                                })()}
                              </div>
                            </div>
                            <div className="bg-orange-50 p-6 rounded-lg border-l-4 border-orange-500">
                              <div className="text-sm text-gray-600 mb-2">현재 원가/개</div>
                              <div className="text-3xl font-bold text-orange-600">{costPrice.toLocaleString()}원</div>
                              <div className="text-xs text-gray-500 mt-2">자수비 없음</div>
                            </div>
                            <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
                              <div className="text-sm text-gray-600 mb-2">목표 수량 달성 시</div>
                              <div className="text-3xl font-bold text-green-600">예상 원가</div>
                              <div className="text-xs text-gray-500 mt-2">50개 기준: 21,000원</div>
                            </div>
                          </div>

                          {/* 수량별 원가 변화 테이블 */}
                          <div className="bg-gray-50 p-6 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-700 mb-4">수량별 원가 변화</h3>
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse text-sm">
                                <thead>
                                  <tr className="bg-white">
                                    <th className="p-2 text-center border-b border-gray-300">수량</th>
                                    <th className="p-2 text-center border-b border-gray-300">상품가/개</th>
                                    <th className="p-2 text-center border-b border-gray-300">자수비/개</th>
                                    <th className="p-2 text-center border-b border-gray-300">원가/개</th>
                                    <th className="p-2 text-center border-b border-gray-300">마진율</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className="bg-orange-50">
                                    <td className="p-2 text-center">11개 (현재)</td>
                                    <td className="p-2 text-center">21,580원</td>
                                    <td className="p-2 text-center">0원</td>
                                    <td className="p-2 text-center font-bold">21,580원</td>
                                    <td className="p-2 text-center text-green-600">63%</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2 text-center">50개</td>
                                    <td className="p-2 text-center">21,000원</td>
                                    <td className="p-2 text-center">0원</td>
                                    <td className="p-2 text-center">21,000원</td>
                                    <td className="p-2 text-center text-green-600">64%</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>

                        {/* 진행사항 타임라인 및 원가 흐름 분석 */}
                        {orders
                          .filter((order: any) => order.order_details?.product_name === '특양면 헤리 맨투맨 (남녀공용)')
                          .map((order: any) => {
                            const orderNumber = order.order_number;
                            const history = progressHistory[orderNumber] || [];
                            if (history.length === 0) return null;
                            
                            return (
                              <div key={order.id} className="space-y-6">
                                <div className="bg-white rounded-lg shadow p-6">
                                  <h2 className="text-xl font-bold text-gray-900 mb-6">
                                    📋 진행사항 히스토리 (주문번호: {orderNumber})
                                  </h2>
                                  <div className="relative">
                                    {history.map((item: any, idx: number) => (
                                      <div key={item.id} className="flex items-start mb-6 last:mb-0">
                                        <div className="flex flex-col items-center mr-4">
                                          <div className={`w-4 h-4 rounded-full ${
                                            idx === history.length - 1 ? 'bg-slate-600' : 'bg-slate-300'
                                          }`} />
                                          {idx < history.length - 1 && (
                                            <div className="w-0.5 h-full bg-gray-300 mt-2" style={{ minHeight: '60px' }} />
                                          )}
                                        </div>
                                        <div className="flex-1 pb-6 last:pb-0">
                                          <div className="flex items-center justify-between">
                                            <div>
                                              <p className="font-semibold text-gray-900">{item.status}</p>
                                              <p className="text-sm text-gray-600 mt-1">{item.status_description}</p>
                                            </div>
                                            <span className="text-xs text-gray-500">
                                              {new Date(item.progress_date).toLocaleDateString('ko-KR')}
                                            </span>
                                          </div>
                                          {item.notes && (
                                            <p className="text-sm text-gray-500 mt-2">{item.notes}</p>
                                          )}
                                          {item.cost_breakdown && Object.keys(item.cost_breakdown).length > 0 && (
                                            <div className="mt-2 text-xs text-gray-600">
                                              <span className="font-semibold">원가 내역: </span>
                                              {Object.entries(item.cost_breakdown)
                                                .filter(([_, v]: [string, any]) => v > 0)
                                                .map(([key, value]: [string, any]) => `${key}: ${Number(value).toLocaleString()}원`)
                                                .join(', ')}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {history.some((item: any) => item.cost_at_stage > 0) && (
                                  <div className="bg-white rounded-lg shadow p-6">
                                    <h2 className="text-xl font-bold text-gray-900 mb-6">
                                      💰 원가 흐름 분석 (주문번호: {orderNumber})
                                    </h2>
                                    <div className="space-y-4">
                                      {history
                                        .filter((item: any) => item.cost_at_stage > 0)
                                        .map((item: any, idx: number) => {
                                          const maxCost = Math.max(...history.filter((i: any) => i.cost_at_stage > 0).map((i: any) => i.cost_at_stage));
                                          const percentage = (item.cost_at_stage / maxCost) * 100;
                                          return (
                                            <div key={item.id} className="flex items-center">
                                              <div className="w-32 text-sm text-gray-600">
                                                {new Date(item.progress_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                                              </div>
                                              <div className="flex-1 mx-4">
                                                <div className="flex items-center justify-between mb-1">
                                                  <span className="text-sm font-medium text-gray-700">{item.status}</span>
                                                  <span className="text-sm font-semibold text-gray-900">
                                                    {item.cost_at_stage.toLocaleString()}원
                                                  </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-3">
                                                  <div
                                                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                                                    style={{ width: `${percentage}%` }}
                                                  />
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-white rounded-lg shadow p-6 text-center py-12">
                    <p className="text-gray-500">특양면 헤리 맨투맨 제품을 찾을 수 없습니다.</p>
                    {productsData.length > 0 && (
                      <p className="text-sm text-gray-400 mt-2">제품 데이터: {productsData.map((p: any) => p.name).join(', ')}</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center py-12">
                <p className="text-gray-500">제품별 상세 정보는 곧 추가될 예정입니다.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'sourcing' && (
          <div className="space-y-6">
            {dataLoading ? (
              <div className="bg-white rounded-lg shadow p-6 text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 mx-auto"></div>
                <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
              </div>
            ) : (
              <>
                {/* 카테고리 탭 */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">상품소싱</h2>
                  <div className="flex space-x-2 mb-6 border-b">
                    <button
                      onClick={() => setSourcingCategory('ball-caps')}
                      className={`px-4 py-2 font-medium text-sm transition-colors ${
                        sourcingCategory === 'ball-caps'
                          ? 'border-b-2 border-indigo-600 text-indigo-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      볼캡
                    </button>
                    <button
                      onClick={() => setSourcingCategory('bucket-hats')}
                      className={`px-4 py-2 font-medium text-sm transition-colors ${
                        sourcingCategory === 'bucket-hats'
                          ? 'border-b-2 border-indigo-600 text-indigo-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      버킷햇
                    </button>
                    <button
                      onClick={() => setSourcingCategory('pouches')}
                      className={`px-4 py-2 font-medium text-sm transition-colors ${
                        sourcingCategory === 'pouches'
                          ? 'border-b-2 border-indigo-600 text-indigo-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      클러치백
                    </button>
                    <button
                      onClick={() => setSourcingCategory('t-shirts')}
                      className={`px-4 py-2 font-medium text-sm transition-colors ${
                        sourcingCategory === 't-shirts'
                          ? 'border-b-2 border-indigo-600 text-indigo-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      티셔츠
                    </button>
                    <button
                      onClick={() => setSourcingCategory('sweatshirts')}
                      className={`px-4 py-2 font-medium text-sm transition-colors ${
                        sourcingCategory === 'sweatshirts'
                          ? 'border-b-2 border-indigo-600 text-indigo-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      맨투맨
                    </button>
                  </div>

                  {/* 제품 목록 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sourcingData.map((product: any) => {
                      const specs = product.specifications || {};
                      const sizeGuide = product.size_guide || {};
                      const pricing = specs.pricing || {};
                      const rank = specs.rank || 0;

                      return (
                        <div
                          key={product.id}
                          className={`border rounded-lg p-4 hover:shadow-lg transition-shadow ${
                            rank === 1 ? 'border-yellow-400 border-2' : ''
                          }`}
                        >
                          {rank > 0 && (
                            <div className="flex items-center justify-between mb-2">
                              <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-medium">
                                {rank}위
                              </span>
                              {product.recommendation_score > 0 && (
                                <span className="text-xs text-gray-500">
                                  추천도: {product.recommendation_score}/10
                                </span>
                              )}
                            </div>
                          )}
                          
                          <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {product.product_name}
                          </h3>

                          {product.image_path && (
                            <div className="mb-4 rounded-lg overflow-hidden bg-gray-100">
                              <img
                                src={product.image_path.startsWith('/') ? product.image_path : `/${product.image_path}`}
                                alt={product.product_name}
                                className="w-full h-48 object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  // webp 실패 시 png 시도
                                  if (target.src.endsWith('.webp')) {
                                    target.src = target.src.replace('.webp', '.png');
                                  } else {
                                    target.style.display = 'none';
                                  }
                                }}
                              />
                            </div>
                          )}

                          <div className="space-y-2 mb-4">
                            {specs.material && (
                              <div className="text-sm">
                                <span className="text-gray-500">소재:</span>{' '}
                                <span className="font-medium">{specs.material}</span>
                              </div>
                            )}
                            {specs.fit && (
                              <div className="text-sm">
                                <span className="text-gray-500">핏:</span>{' '}
                                <span className="font-medium">{specs.fit}</span>
                              </div>
                            )}
                            {sizeGuide.size && (
                              <div className="text-sm">
                                <span className="text-gray-500">사이즈:</span>{' '}
                                <span className="font-medium">{sizeGuide.size}</span>
                              </div>
                            )}
                            {product.price > 0 && (
                              <div className="text-sm">
                                <span className="text-gray-500">최저가:</span>{' '}
                                <span className="font-bold text-indigo-600">
                                  ₩{product.price.toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>

                          {Object.keys(pricing).length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">가격표</h4>
                              <div className="text-xs space-y-1">
                                {Object.entries(pricing).slice(0, 5).map(([qty, price]: [string, any]) => (
                                  <div key={qty} className="flex justify-between">
                                    <span>{qty}개:</span>
                                    <span className="font-medium">₩{Number(price).toLocaleString()}</span>
                                  </div>
                                ))}
                                {Object.keys(pricing).length > 5 && (
                                  <div className="text-gray-400 text-center mt-1">
                                    ... 외 {Object.keys(pricing).length - 5}개 수량
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {specs.features && Array.isArray(specs.features) && specs.features.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-4">
                              {specs.features.map((feature: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                                >
                                  {feature}
                                </span>
                              ))}
                            </div>
                          )}

                          {specs.marpple_url && (
                            <a
                              href={specs.marpple_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block w-full text-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                            >
                              마플 상품 페이지 보기
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {sourcingData.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>해당 카테고리의 상품소싱 데이터가 없습니다.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'design' && (
          <div className="space-y-6">
            {dataLoading ? (
              <div className="bg-white rounded-lg shadow p-6 text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 mx-auto"></div>
                <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">디자인 빌드업</h2>
                {designsData.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {designsData.map((design: any) => (
                      <div key={design.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{design.design_name}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {design.brand?.name || '브랜드 없음'} · {design.product?.name || '제품 없음'}
                        </p>
                        {design.design_image_path && (
                          <div className="mb-4 rounded-lg overflow-hidden bg-gray-100">
                            <img
                              src={design.design_image_path}
                              alt={design.design_name}
                              className="w-full h-48 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            design.status === 'final' ? 'bg-green-100 text-green-800' :
                            design.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {design.status === 'final' ? '최종' :
                             design.status === 'approved' ? '승인됨' : '초안'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Palette className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>디자인 데이터가 없습니다.</p>
                    <p className="text-sm mt-2">새 디자인을 추가해주세요.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'brand' && (
          <div className="space-y-6">
            {dataLoading ? (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 mx-auto"></div>
                <p className="mt-4 text-slate-600">데이터를 불러오는 중...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-8">
                  <h2 className="text-2xl font-semibold text-slate-900 mb-2">브랜드 포트폴리오</h2>
                  <p className="text-sm text-slate-500 mb-8">
                    마스 브랜드 랩스에서 운영하는 브랜드 포트폴리오 및 콜라보레이션 파트너
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {brands.map((brand: any) => {
                      // 로고 경로 매핑
                      const logoMap: { [key: string]: string } = {
                        'MASSGOO': '/assets/logos/web/massgoo_text-logo_black.webp',
                        'SINGSING': '/assets/logos/sources/singsing/singsing_logo_192x192.png',
                        'TOBY': '/assets/logos/sources/toby/toby_logo.png',
                        'MUZIIK': '/assets/logos/web/muziik_italic_logo.webp',
                        'SECRET_WEAPON': '/assets/logos/sources/secret/secret-weapon-logo.webp',
                        'SECRET_FORCE': '/assets/logos/sources/secret/secret-force-logo.webp'
                      };
                      const logoPath = brand.logo_path || logoMap[brand.code] || null;
                      
                      // 진행 중/완료 주문 수 계산
                      const inProgressCount = brand.stats.totalOrders - brand.stats.completedOrders;
                      
                      return (
                        <div 
                          key={brand.id} 
                          className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                        >
                          {/* 로고 이미지 */}
                          {logoPath && (
                            <div className="text-center mb-6">
                              <img
                                src={logoPath}
                                alt={`${brand.name} 로고`}
                                className="max-w-[180px] h-auto mx-auto mb-4 opacity-90 group-hover:opacity-100 transition-opacity"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          
                          {/* 브랜드 이름 */}
                          <h3 className="text-lg font-medium text-slate-600 mb-3 text-center">
                            {brand.name}
                          </h3>
                          
                          {/* 브랜드 설명 */}
                          <p className="text-sm text-slate-600 mb-6 text-center leading-relaxed line-clamp-3">
                            {brand.description}
                          </p>
                          
                          {/* 통계 정보 */}
                          <div className="pt-6 border-t border-slate-100">
                            <div className="flex justify-around text-center">
                              <div>
                                <div className="text-xs text-slate-500 mb-2">진행 중</div>
                                <div className="text-xl font-semibold text-slate-700">
                                  {inProgressCount}개
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-500 mb-2">완료</div>
                                <div className="text-xl font-semibold text-slate-700">
                                  {brand.stats.completedOrders}개
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {brands.length === 0 && (
                      <div className="col-span-full text-center py-12">
                        <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">브랜드 데이터가 없습니다.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'supplier' && (
          <div className="space-y-6">
            {dataLoading ? (
              <div className="bg-white rounded-lg shadow p-6 text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 mx-auto"></div>
                <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">업체 조사</h2>
                {suppliersData.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {suppliersData.map((supplier: any) => (
                      <div key={supplier.id} className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-gray-900">{supplier.name}</h3>
                          {supplier.api_available && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                              API 연동 가능
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-4">{supplier.description || '설명 없음'}</p>
                        <div className="space-y-2 mb-4">
                          <div className="text-sm">
                            <span className="text-gray-500">코드:</span>{' '}
                            <span className="font-medium">{supplier.code}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500">최소 주문 수량:</span>{' '}
                            <span className="font-medium">{supplier.min_order_quantity}개</span>
                          </div>
                          {supplier.website_url && (
                            <div className="text-sm">
                              <a
                                href={supplier.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-800"
                              >
                                웹사이트 방문 →
                              </a>
                            </div>
                          )}
                        </div>
                        {supplier.product_categories && Array.isArray(supplier.product_categories) && supplier.product_categories.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {supplier.product_categories.map((category: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                              >
                                {category}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Store className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>업체 데이터가 없습니다.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 진행사항 모달 */}
        {showProgressModal && selectedOrderNumber && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  진행사항 상세 (주문번호: {selectedOrderNumber})
                </h2>
                <button
                  onClick={() => {
                    setShowProgressModal(false);
                    setSelectedOrderNumber(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6">
                {progressHistory[selectedOrderNumber] && progressHistory[selectedOrderNumber].length > 0 ? (
                  <>
                    {/* 타임라인 */}
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">진행사항 타임라인</h3>
                      <div className="relative">
                        {progressHistory[selectedOrderNumber].map((item: any, idx: number) => (
                          <div key={item.id} className="flex items-start mb-6 last:mb-0">
                            <div className="flex flex-col items-center mr-4">
                              <div className={`w-4 h-4 rounded-full ${
                                idx === progressHistory[selectedOrderNumber].length - 1 ? 'bg-green-500' : 'bg-gray-300'
                              }`} />
                              {idx < progressHistory[selectedOrderNumber].length - 1 && (
                                <div className="w-0.5 h-full bg-gray-300 mt-2" style={{ minHeight: '80px' }} />
                              )}
                            </div>
                            <div className="flex-1 pb-6 last:pb-0">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="font-semibold text-gray-900">{item.status}</p>
                                  <p className="text-sm text-gray-600 mt-1">{item.status_description}</p>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {new Date(item.progress_date).toLocaleDateString('ko-KR')}
                                </span>
                              </div>
                              {item.notes && (
                                <p className="text-sm text-gray-500 mt-2 bg-gray-50 p-3 rounded">{item.notes}</p>
                              )}
                              {item.cost_breakdown && Object.keys(item.cost_breakdown).length > 0 && (
                                <div className="mt-3 bg-blue-50 p-3 rounded">
                                  <p className="text-xs font-semibold text-blue-900 mb-2">원가 내역:</p>
                                  <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(item.cost_breakdown)
                                      .filter(([_, v]: [string, any]) => v > 0)
                                      .map(([key, value]: [string, any]) => (
                                        <div key={key} className="flex justify-between text-xs">
                                          <span className="text-blue-700">{key}:</span>
                                          <span className="font-semibold text-blue-900">
                                            {Number(value).toLocaleString()}원
                                          </span>
                                        </div>
                                      ))}
                                  </div>
                                  {item.cost_at_stage > 0 && (
                                    <div className="mt-2 pt-2 border-t border-blue-200 flex justify-between">
                                      <span className="text-xs font-semibold text-blue-900">누적 원가:</span>
                                      <span className="text-xs font-bold text-blue-900">
                                        {item.cost_at_stage.toLocaleString()}원
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 원가 흐름 분석 */}
                    {progressHistory[selectedOrderNumber].some((item: any) => item.cost_at_stage > 0) && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">원가 흐름 분석</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          {progressHistory[selectedOrderNumber]
                            .filter((item: any) => item.cost_at_stage > 0)
                            .map((item: any, idx: number) => {
                              const maxCost = Math.max(
                                ...progressHistory[selectedOrderNumber]
                                  .filter((i: any) => i.cost_at_stage > 0)
                                  .map((i: any) => i.cost_at_stage)
                              );
                              const percentage = (item.cost_at_stage / maxCost) * 100;
                              
                              return (
                                <div key={item.id} className="mb-4 last:mb-0">
                                  <div className="flex items-center justify-between mb-2">
                                    <div>
                                      <span className="text-sm font-medium text-gray-700">{item.status}</span>
                                      <span className="text-xs text-gray-500 ml-2">
                                        ({new Date(item.progress_date).toLocaleDateString('ko-KR')})
                                      </span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900">
                                      {item.cost_at_stage.toLocaleString()}원
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-4">
                                    <div
                                      className="bg-gradient-to-r from-slate-500 to-slate-600 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                                      style={{ width: `${percentage}%` }}
                                    >
                                      {percentage > 20 && (
                                        <span className="text-xs text-white font-semibold">
                                          {percentage.toFixed(0)}%
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">진행사항 데이터가 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 주문 추가/수정 모달 */}
      {showOrderModal && (
        <OrderModal
          order={editingOrder}
          brands={brands}
          products={productsData}
          onClose={() => {
            setShowOrderModal(false);
            setEditingOrder(null);
          }}
          onSave={handleSaveOrder}
        />
      )}

      {/* 진행사항 추가/수정 모달 */}
      {showProgressFormModal && (
        <ProgressFormModal
          progress={editingProgress}
          orders={orders}
          onClose={() => {
            setShowProgressFormModal(false);
            setEditingProgress(null);
          }}
          onSave={handleSaveProgress}
        />
      )}

      {/* 추가 결제 등록/수정 모달 */}
      {showPaymentModal && (
        <PaymentModal
          payment={editingPayment}
          orders={orders}
          products={productsData}
          onClose={() => {
            setShowPaymentModal(false);
            setEditingPayment(null);
          }}
          onSave={handleSavePayment}
        />
      )}
    </div>
  );
}

// 주문 모달 컴포넌트
function OrderModal({ order, brands, products, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    order_number: order?.order_number || '',
    brand_id: order?.brand_id || '',
    product_id: order?.product_id || '',
    order_date: order?.order_date ? order.order_date.split('T')[0] : '',
    delivery_date: order?.delivery_date ? order.delivery_date.split('T')[0] : '',
    status: order?.status || 'preparing',
    quantity: order?.quantity || 1,
    product_price: order?.product_price || 0,
    embroidery_fee: order?.embroidery_fee || 0,
    total_amount: order?.total_amount || 0,
    final_amount: order?.final_amount || 0,
    tracking_number: order?.tracking_number || '',
    notes: order?.notes || '',
    order_details: order?.order_details || {}
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-slate-900">
              {order ? '주문 수정' : '주문 추가'}
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  주문번호 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.order_number}
                  onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  브랜드 *
                </label>
                <select
                  required
                  value={formData.brand_id}
                  onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  <option value="">선택하세요</option>
                  {brands.map((brand: any) => (
                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  제품
                </label>
                <select
                  value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  <option value="">선택하세요</option>
                  {products.map((product: any) => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  주문일 *
                </label>
                <input
                  type="date"
                  required
                  value={formData.order_date}
                  onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  배송일
                </label>
                <input
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상태
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  <option value="preparing">제작 준비중</option>
                  <option value="in_progress">제작 중</option>
                  <option value="completed">완료</option>
                  <option value="cancelled">취소</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  수량
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상품가
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.product_price}
                  onChange={(e) => setFormData({ ...formData, product_price: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  자수비
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.embroidery_fee}
                  onChange={(e) => setFormData({ ...formData, embroidery_fee: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  총 금액
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  최종 금액
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.final_amount}
                  onChange={(e) => setFormData({ ...formData, final_amount: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  배송 추적번호
                </label>
                <input
                  type="text"
                  value={formData.tracking_number}
                  onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                메모
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-slate-700 rounded-md hover:bg-slate-800 transition-colors"
              >
                저장
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// 진행사항 모달 컴포넌트
function ProgressFormModal({ progress, orders, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    order_id: progress?.order_id || '',
    status: progress?.status || '',
    status_description: progress?.status_description || '',
    progress_date: progress?.progress_date ? progress.progress_date.split('T')[0] : new Date().toISOString().split('T')[0],
    cost_at_stage: progress?.cost_at_stage || 0,
    cost_breakdown: progress?.cost_breakdown || {},
    notes: progress?.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-slate-900">
              {progress ? '진행사항 수정' : '진행사항 추가'}
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                주문 *
              </label>
              <select
                required
                value={formData.order_id}
                onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">선택하세요</option>
                {orders.map((order: any) => (
                  <option key={order.id} value={order.id}>
                    {order.order_number} - {order.order_details?.product_name || '제품명 없음'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                상태 *
              </label>
              <input
                type="text"
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                placeholder="예: 제작 시작, 샘플 확인, 배송 중 등"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                상태 설명
              </label>
              <textarea
                value={formData.status_description}
                onChange={(e) => setFormData({ ...formData, status_description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                진행일 *
              </label>
              <input
                type="date"
                required
                value={formData.progress_date}
                onChange={(e) => setFormData({ ...formData, progress_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                단계별 원가
              </label>
              <input
                type="number"
                min="0"
                value={formData.cost_at_stage}
                onChange={(e) => setFormData({ ...formData, cost_at_stage: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                메모
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-slate-700 rounded-md hover:bg-slate-800 transition-colors"
              >
                저장
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// 추가 결제 모달 컴포넌트
function PaymentModal({ payment, orders, products, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    order_id: payment?.order_id || '',
    product_id: payment?.product_id || '',
    payment_type: payment?.payment_type || 'embroidery',
    payment_amount: payment?.payment_amount || 0,
    payment_date: payment?.payment_date ? payment.payment_date.split('T')[0] : new Date().toISOString().split('T')[0],
    marpple_order_number: payment?.marpple_order_number || '',
    description: payment?.description || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-slate-900">
              {payment ? '추가 결제 수정' : '추가 결제 등록'}
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                주문 *
              </label>
              <select
                required
                value={formData.order_id}
                onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">선택하세요</option>
                {orders.map((order: any) => (
                  <option key={order.id} value={order.id}>
                    {order.order_number} - {order.order_details?.product_name || '제품명 없음'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                제품
              </label>
              <select
                value={formData.product_id}
                onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">선택하세요</option>
                {products.map((product: any) => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                결제 유형 *
              </label>
              <select
                required
                value={formData.payment_type}
                onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="embroidery">자수비</option>
                <option value="custom">커스텀</option>
                <option value="shipping">배송비</option>
                <option value="other">기타</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                결제 금액 *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.payment_amount}
                onChange={(e) => setFormData({ ...formData, payment_amount: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                결제일 *
              </label>
              <input
                type="date"
                required
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                마플 주문번호
              </label>
              <input
                type="text"
                value={formData.marpple_order_number}
                onChange={(e) => setFormData({ ...formData, marpple_order_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-slate-700 rounded-md hover:bg-slate-800 transition-colors"
              >
                저장
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

