document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('investment-form');
    const resultDiv = document.getElementById('result');
    const animationDiv = document.getElementById('animation');
    const chartsDiv = document.getElementById('charts');
    const combinedCtx = document.getElementById('combined-chart').getContext('2d');
    const resetButton = document.getElementById('reset-button'); // 초기화 버튼    
    let combinedChart; // 결합된 그래프 인스턴스
    let investmentsData = []; // JSON에서 불러온 투자 항목 데이터

    // 투자 항목 <select>를 초기화하는 함수
    async function initializeInvestmentTypes() {
        try {
            const response = await fetch('gguldata.json');
            const data = await response.json();
            investmentsData = data.investments;

            const mainInvestmentTypeSelect = document.getElementById('main-investment-type');

            investmentsData.forEach(investment => {
                const option = document.createElement('option');
                option.value = investment.type;
                option.textContent = investment.label;
                mainInvestmentTypeSelect.appendChild(option);
            });

            // Select2 초기화 제거 (표준 드롭다운 사용)

        } catch (error) {
            console.error('투자 항목을 불러오는 중 오류 발생:', error);
            alert('투자 항목을 불러오는 데 문제가 발생했습니다.');
        }
    }

    // 세부 종목 <select>를 초기화하는 함수
    function initializeSubInvestmentTypes(selectedType) {
        const subInvestmentTypeSelect = document.getElementById('sub-investment-type');

        subInvestmentTypeSelect.innerHTML = ''; // 기존 옵션 제거

        if (!selectedType) {
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = '먼저 투자 항목을 선택하세요';
            defaultOption.disabled = true;
            defaultOption.selected = true;
            subInvestmentTypeSelect.appendChild(defaultOption);
            return;
        }

        const selectedInvestment = investmentsData.find(inv => inv.type === selectedType);
        if (selectedInvestment && selectedInvestment.subItems) {
            // 기본 옵션 추가
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = '선택하세요';
            defaultOption.disabled = true;
            defaultOption.selected = true;
            subInvestmentTypeSelect.appendChild(defaultOption);

            // 세부 종목 추가
            selectedInvestment.subItems.forEach(subItem => {
                const option = document.createElement('option');
                option.value = subItem.type;
                option.textContent = subItem.label;
                subInvestmentTypeSelect.appendChild(option);
            });
        } else {
            const noOption = document.createElement('option');
            noOption.value = '';
            noOption.textContent = '세부 종목이 없습니다';
            noOption.disabled = true;
            noOption.selected = true;
            subInvestmentTypeSelect.appendChild(noOption);
        }

        // Select2 초기화 제거 (표준 드롭다운 사용)
    }

    initializeInvestmentTypes();

    // 메인 투자 항목 선택 시 세부 종목 업데이트
    const mainInvestmentTypeSelect = document.getElementById('main-investment-type');
    mainInvestmentTypeSelect.addEventListener('change', (e) => {
        const selectedType = e.target.value;
        initializeSubInvestmentTypes(selectedType);
        // 서브 투자 종목 선택 시 첫 연도로 자동 설정하는 기능을 초기화
        setFirstYearOnSubInvestmentChange();
    });

    // 서브 투자 종목 변경 시 첫 연도로 설정하는 함수
    function setFirstYearOnSubInvestmentChange() {
        const subInvestmentTypeSelect = document.getElementById('sub-investment-type');
        const investmentYearInput = document.getElementById('investment-year');

        // 서브 투자 종목 선택 시 이벤트 리스너 추가
        subInvestmentTypeSelect.addEventListener('change', () => {
            const mainType = mainInvestmentTypeSelect.value;
            const subType = subInvestmentTypeSelect.value;

            if (!mainType || !subType) return;

            const mainInvestment = investmentsData.find(inv => inv.type === mainType);
            if (!mainInvestment) return;

            const subInvestment = mainInvestment.subItems.find(sub => sub.type === subType);
            if (!subInvestment) return;

            const dataYears = Object.keys(subInvestment.data)
                .map(year => parseInt(year))
                .filter(year => !isNaN(year))
                .sort((a, b) => a - b);
            if (dataYears.length > 0) {
                investmentYearInput.value = dataYears[0];
            }
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const mainType = document.getElementById('main-investment-type').value;
        const subType = document.getElementById('sub-investment-type').value;
        const amountInput = document.getElementById('investment-amount').value;
        const yearInput = document.getElementById('investment-year').value;

        const amount = parseFloat(amountInput);
        const year = parseInt(yearInput);

        if (!mainType || !subType) {
            alert('투자 항목과 세부 종목을 모두 선택하세요.');
            return;
        }

        if (isNaN(amount) || amount < 1) {
            alert('유효한 투자 금액을 입력하세요.');
            return;
        }

        if (isNaN(year)) {
            alert('유효한 투자 년도를 입력하세요.');
            return;
        }

        try {
            const response = await fetch('gguldata.json');
            const data = await response.json();

            const mainInvestment = data.investments.find(inv => inv.type === mainType);
            if (!mainInvestment) {
                alert('선택한 메인 투자 항목의 데이터가 없습니다.');
                return;
            }

            const subInvestment = mainInvestment.subItems.find(sub => sub.type === subType);
            if (!subInvestment) {
                alert('선택한 세부 종목의 데이터가 없습니다.');
                return;
            }

            const investmentData = subInvestment.data;
            const initialPrice = investmentData[year];
            let currentPrice = investmentData['2024'];

            // 2024년 데이터가 없을 경우, 가장 최신 연도 데이터 사용
            if (currentPrice === undefined) {
                const availableYears = Object.keys(investmentData)
                    .map(year => parseInt(year))
                    .filter(year => !isNaN(year))
                    .sort((a, b) => a - b);
                if (availableYears.length > 0) {
                    const latestYear = availableYears[availableYears.length - 1];
                    currentPrice = investmentData[latestYear];
                } else {
                    alert('사용 가능한 투자 데이터가 없습니다.');
                    return;
                }
            }

            if (!initialPrice) {
                alert(`${year}년도의 데이터가 없습니다.`);
                return;
            }

            const growth = ((currentPrice - initialPrice) / initialPrice) * 100;
            const currentValue = (currentPrice / initialPrice) * amount;

            // 결과 표시
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `
                <h2>투자 결과</h2>
                <p>${year}년에 ${formatCurrency(amount)}를 투자하셨다면, <br /> ${currentPrice === investmentData['2024'] ? '2024년' : `${Math.max(...Object.keys(investmentData).map(y => parseInt(y)))}년`} 약 <strong>${formatCurrency(currentValue)}</strong>이 되었습니다.</p>
                <p>변동률: <strong>${growth.toFixed(2)}%</strong></p>
            `;

            // 애니메이션 제어
            animationDiv.innerHTML = '';
            if (growth > 0) {
                // 가격 상승 시 애니메이션 추가
                for (let i = 0; i < 1; i++) { // 원하는 반복 횟수로 조정
                    const img = document.createElement('img');
                    img.src = './images/happy.jpeg'; // 상승 시 사용할 이미지
                    img.alt = '상승';
                    img.classList.add('bounce'); // 애니메이션 클래스 추가
                    img.style.width = '150px';
                    animationDiv.appendChild(img);
                }
            } else if (growth < 0) {
                // 가격 하락 시 애니메이션 추가
                for (let i = 0; i < 1; i++) { // 원하는 반복 횟수로 조정
                    const img = document.createElement('img');
                    img.src = './images/sad.jpg'; // 하락 시 사용할 이미지
                    img.alt = '하락';
                    img.classList.add('shake'); // 애니메이션 클래스 추가
                    img.style.width = '150px';
                    animationDiv.appendChild(img);
                }
            } else {
                // 변동 없음
                animationDiv.innerHTML = '<p>투자 변동이 없습니다.</p>';
            }

            // 그래프 데이터 준비
            const labels = [];
            const investmentValues = [];
            const priceVariationValues = []; // 세부 항목별 가격 변동 데이터
            let endYear = '2024';
            if (currentPrice === investmentData['2024']) {
                endYear = '2024';
            } else {
                // 2024년이 없을 경우, 가장 최신 연도 사용
                const availableYears = Object.keys(investmentData)
                    .map(year => parseInt(year))
                    .filter(year => !isNaN(year))
                    .sort((a, b) => a - b);
                endYear = availableYears.length > 0 ? availableYears[availableYears.length - 1].toString() : year.toString();
            }

            for (let y = year; y <= parseInt(endYear); y++) {
                const price = investmentData[y];
                if (price) {
                    labels.push(`${y}`);
                    const value = Math.floor((price / initialPrice) * amount); // 총 투자 금액 변화
                    investmentValues.push(value);

                    priceVariationValues.push(price); // 세부 항목별 가격 변동
                }
            }

            // 결합된 그래프 표시
            chartsDiv.style.display = 'flex';
            if (combinedChart) {
                combinedChart.destroy(); // 기존 차트가 있으면 제거
            }

            combinedChart = new Chart(combinedCtx, {
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: `${subInvestment.label} 총 금액 (원)`,
                            data: investmentValues,
                            type: 'line',
                            yAxisID: 'y',
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.1,
                            pointRadius: 3,
                            pointBackgroundColor: 'rgba(75, 192, 192, 1)'
                        },
                        {
                            label: `${subInvestment.label} 가격 변동 (원,$)`,
                            data: priceVariationValues,
                            type: 'bar',
                            yAxisID: 'y1',
                            backgroundColor: 'rgba(255, 99, 132, 0.5)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false, // 그래프의 높이를 CSS로 제어
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    stacked: false,
                    scales: {
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                                display: true,
                                text: '총 투자 금액 (원)',
                                font: {
                                    size: 14
                                }
                            },
                            ticks: {
                                callback: function(value) {
                                    return formatCurrency(value);
                                },
                                font: {
                                    size: 12
                                }
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            grid: {
                                drawOnChartArea: false, // 보조 축의 그리드선 숨기기
                            },
                            title: {
                                display: true,
                                text: '가격 변동 (원,$)',
                                font: {
                                    size: 14
                                }
                            },
                            ticks: {
                                callback: function(value) {
                                    return formatCurrency(value);
                                },
                                font: {
                                    size: 12
                                }
                            }
                        },
                        x: {
                            
                            ticks: {
                                font: {
                                    size: 12
                                }
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return ` ${formatCurrency(context.parsed.y)}`;
                                }
                            },
                            titleFont: {
                                size: 14
                            },
                            bodyFont: {
                                size: 12
                            }
                        },
                        legend: {
                            labels: {
                                font: {
                                    size: 14
                                }
                            },
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: '총 투자 금액과 세부 종목 가격 변동',
                            font: {
                                size: 16
                            }
                        }
                    }
                }
            });

        } catch (error) {
            console.error('데이터를 불러오는 중 오류 발생:', error);
            alert('데이터를 불러오는 데 문제가 발생했습니다.');
        }
    });

    // 초기화 버튼 이벤트 리스너
    resetButton.addEventListener('click', () => {
        // 폼 리셋
        form.reset();

        // 세부 종목 드롭다운을 기본 상태로 초기화
        const subInvestmentTypeSelect = document.getElementById('sub-investment-type');
        subInvestmentTypeSelect.innerHTML = '<option value="" disabled selected>먼저 투자 항목을 선택하세요</option>';

        // 결과 영역 숨기기
        resultDiv.style.display = 'none';
        resultDiv.innerHTML = '';

        // 투자 항목 상세 정보 숨기기
        const investmentDetailsDiv = document.getElementById('investment-details');
        investmentDetailsDiv.innerHTML = '';

        // 애니메이션 영역 초기화
        animationDiv.innerHTML = '';

        // 그래프 숨기기 및 초기화
        chartsDiv.style.display = 'none';
        if (combinedChart) {
            combinedChart.destroy();
            combinedChart = null;
        }
    });
    
    // 숫자를 단위에 따라 포맷팅하는 함수
    function formatCurrency(num) {
        const ONE_TRILLION = 1000000000000; // 1조
        const ONE_HUNDRED_MILLION = 100000000; // 1억
        const ONE_TEN_THOUSAND = 10000; // 1만원

        let result = '';

        if (num >= ONE_TRILLION) { // 1조 이상
            const cho = Math.floor(num / ONE_TRILLION);
            result += `${cho}조`;
            num %= ONE_TRILLION;
        }

        if (num >= ONE_HUNDRED_MILLION) { // 1억 이상
            const eok = Math.floor(num / ONE_HUNDRED_MILLION);
            result += `${eok}억`;
            num %= ONE_HUNDRED_MILLION;
        }

        if (num >= ONE_TEN_THOUSAND) { // 1만원 이상
            const man = Math.floor(num / ONE_TEN_THOUSAND);
            result += `${man}만원`;
            num %= ONE_TEN_THOUSAND;
        }

        if (result === '') { // 원 단위
            result = `${num.toLocaleString('ko-KR')}`;
        }

        return result;
    }
});
