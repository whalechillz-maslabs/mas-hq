export default function DriverShaftPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto bg-white p-10 shadow-lg rounded-lg">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 pb-4 border-b-4 border-green-700">
          일본 프리미엄 드라이버 샤프트 비교: 와타나베제작소 vs. RANDO
        </h1>
        
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h2 className="text-2xl font-semibold text-green-700 mb-4 pl-3 border-l-4 border-green-700">
            브랜드 소개
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-green-700 mb-2">와타나베제작소 (渡辺製作所)</h3>
              <p className="text-gray-700 leading-relaxed">
                일본의 전통적인 골프 클럽 제작사로, 1953년에 설립되었습니다. 
                최고급 드라이버 샤프트와 헤드를 제작하며, 프로 골퍼들 사이에서도 높은 평가를 받고 있습니다.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-green-700 mb-2">RANDO (ランド)</h3>
              <p className="text-gray-700 leading-relaxed">
                일본의 프리미엄 골프 장비 브랜드로, 혁신적인 기술과 전통적인 제작 방식을 결합하여 
                최고 품질의 골프 클럽을 제공합니다.
              </p>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-green-700 mb-6 pl-3 border-l-4 border-green-700">
          드라이버 샤프트 비교표
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse shadow-lg">
            <thead className="bg-gradient-to-r from-green-700 to-green-600 text-white">
              <tr>
                <th className="p-4 text-left font-semibold">구분</th>
                <th className="p-4 text-left font-semibold">와타나베제작소</th>
                <th className="p-4 text-left font-semibold">RANDO</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-green-50 transition-colors">
                <td className="p-4 border-b border-gray-200 font-medium">샤프트 재질</td>
                <td className="p-4 border-b border-gray-200">프리미엄 카본 파이버</td>
                <td className="p-4 border-b border-gray-200">고급 카본 컴포지트</td>
              </tr>
              <tr className="hover:bg-green-50 transition-colors bg-gray-50">
                <td className="p-4 border-b border-gray-200 font-medium">강성 (Flex)</td>
                <td className="p-4 border-b border-gray-200">S, R, SR, X</td>
                <td className="p-4 border-b border-gray-200">S, R, SR, X</td>
              </tr>
              <tr className="hover:bg-green-50 transition-colors">
                <td className="p-4 border-b border-gray-200 font-medium">무게</td>
                <td className="p-4 border-b border-gray-200">45-65g</td>
                <td className="p-4 border-b border-gray-200">42-68g</td>
              </tr>
              <tr className="hover:bg-green-50 transition-colors bg-gray-50">
                <td className="p-4 border-b border-gray-200 font-medium">토크 (Torque)</td>
                <td className="p-4 border-b border-gray-200">2.5° - 4.0°</td>
                <td className="p-4 border-b border-gray-200">2.0° - 4.5°</td>
              </tr>
              <tr className="hover:bg-green-50 transition-colors">
                <td className="p-4 border-b border-gray-200 font-medium">가격대</td>
                <td className="p-4 border-b border-gray-200">프리미엄 (15-25만원)</td>
                <td className="p-4 border-b border-gray-200">프리미엄 (12-22만원)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-8 space-y-6">
          <h2 className="text-2xl font-semibold text-green-700 mb-4 pl-3 border-l-4 border-green-700">
            와타나베제작소의 특징
          </h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>전통적인 일본 제작 기술과 현대적인 공학의 완벽한 조화</li>
            <li>프로 골퍼들의 피드백을 반영한 최적화된 설계</li>
            <li>높은 일관성과 정확성을 위한 엄격한 품질 관리</li>
            <li>개인 맞춤형 샤프트 제작 서비스 제공</li>
          </ul>

          <h2 className="text-2xl font-semibold text-green-700 mb-4 pl-3 border-l-4 border-green-700">
            RANDO의 특징
          </h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>혁신적인 카본 컴포지트 기술 적용</li>
            <li>다양한 플레이어 스타일에 맞는 샤프트 옵션</li>
            <li>경쟁력 있는 가격대와 높은 성능 비율</li>
            <li>지속적인 연구개발을 통한 기술 혁신</li>
          </ul>

          <h2 className="text-2xl font-semibold text-green-700 mb-4 pl-3 border-l-4 border-green-700">
            선택 가이드
          </h2>
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">와타나베제작소를 선택해야 할 때:</h3>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>최고 품질과 전통적인 제작 방식을 중시하는 경우</li>
              <li>프로 수준의 정확성과 일관성이 필요한 경우</li>
              <li>개인 맞춤형 서비스를 원하는 경우</li>
            </ul>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-3">RANDO를 선택해야 할 때:</h3>
            <ul className="list-disc list-inside space-y-1 text-green-700">
              <li>혁신적인 기술과 현대적인 디자인을 선호하는 경우</li>
              <li>다양한 옵션과 합리적인 가격을 원하는 경우</li>
              <li>새로운 골프 기술을 시도해보고 싶은 경우</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 p-6 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">💡 전문가 조언</h3>
          <p className="text-yellow-700">
            두 브랜드 모두 최고 품질의 드라이버 샤프트를 제공합니다. 
            개인의 스윙 스타일, 체력, 그리고 예산을 고려하여 선택하시기 바랍니다. 
            가능하다면 실제로 테스트해보고 전문가의 조언을 받아보시는 것을 권장합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
