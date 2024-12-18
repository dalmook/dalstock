document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('investment-form');
    const resultDiv = document.getElementById('result');
    const animationDiv = document.getElementById('animation');
    const totalChartContainer = document.getElementById('total-chart-container');
    const priceVariationChartContainer = document.getElementById('price-variation-chart-container');
    const totalCtx = document.getElementById('total-investment-chart').getContext('2d');
    const priceVariationCtx = document.getElementById('price-variation-chart').getContext('2d');
    let totalInvestmentChart; // 총 투자 금액 그래프 인스턴스
    let priceVariationChart; // 세부 항목별 가격 변동 그래프 인스턴스
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

        // Select2 초기화 또는 재초기화
        $(subInvestmentTypeSelect).select2({
            placeholder: '선택하세요',
            allowClear: true,
            width: '100%' // 드롭다운 너비를 100%로 설정
        });
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

        // Select2의 change 이벤트를 사용
        $(subInvestmentTypeSelect).on('change', () => {
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
            const currentPrice = investmentData['2024'];

            if (!initialPrice) {
                alert(`${year}년도의 데이터가 없습니다.`);
                return;
            }

            const growth = ((currentPrice - initialPrice) / initialPrice) * 100;
            const currentValue = ((currentPrice / initialPrice) * amount);

            // 결과 표시
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `
                <h2>투자 결과</h2>
                <p>${year}년에 ${formatNumber(amount)}를 투자하셨다면, 2024년 현재 약 <strong>${formatNumber(currentValue)}</strong>이 되었습니다.</p>
                <p>변동률: <strong>${growth.toFixed(2)}%</strong></p>
            `;

            // 투자 항목 상세 정보 표시
            const investmentDetailsDiv = document.getElementById('investment-details');
            console.log('investmentDetailsDiv:', investmentDetailsDiv); // 디버깅 로그

            if (investmentDetailsDiv) {
                investmentDetailsDiv.innerHTML = `
                    <h3>${subInvestment.label}</h3>
                    <img src="${subInvestment.logo || 'default-logo.png'}" alt="${subInvestment.label}" style="width: 50px; height: 50px;">
                    <p>${subInvestment.description || '세부 항목에 대한 설명이 없습니다.'}</p>
                `;
            } else {
                console.error('investment-details 요소를 찾을 수 없습니다.');
            }

            // 애니메이션 제어
            animationDiv.innerHTML = '';
            if (growth > 0) {
                // 가격 상승 시 애니메이션 추가
                for (let i = 0; i < 5; i++) { // 원하는 반복 횟수로 조정
                    const img = document.createElement('img');
                    img.src = './images/happy.jpeg'; // 상승 시 사용할 이미지
                    img.alt = '상승';
                    img.classList.add('bounce');
                    img.style.width = '100px';
                    animationDiv.appendChild(img);
                }
            } else if (growth < 0) {
                // 가격 하락 시 애니메이션 추가
                for (let i = 0; i < 5; i++) { // 원하는 반복 횟수로 조정
                    const img = document.createElement('img');
                    img.src = './images/sad.jpg'; // 하락 시 사용할 이미지
                    img.alt = '하락';
                    img.classList.add('shake');
                    img.style.width = '100px';
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
            for (let y = year; y <= 2024; y++) {
                const price = investmentData[y];
                if (price) {
                    labels.push(`${y}`);
                    const value = Math.floor((price / initialPrice) * amount); // 총 투자 금액 변화
                    investmentValues.push(value);

                    priceVariationValues.push(price); // 세부 항목별 가격 변동
                }
            }

            // 총 투자 금액 그래프 표시
            totalChartContainer.style.display = 'block';
            if (totalInvestmentChart) {
                totalInvestmentChart.destroy(); // 기존 그래프가 있으면 제거
            }

            totalInvestmentChart = new Chart(totalCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: `${subInvestment.label} 총 투자 금액 (원)`,
                        data: investmentValues,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.1,
                        pointRadius: 3,
                        pointBackgroundColor: 'rgba(75, 192, 192, 1)'
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: false,
                            title: {
                                display: true,
                                text: '총 투자 금액 (원)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return formatCurrency(value);
                                }
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: '연도'
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return ` ${formatCurrency(context.parsed.y)}`;
                                }
                            }
                        },
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: '총 투자 금액 변화'
                        }
                    }
                }
            });

            // 세부 항목별 가격 변동 그래프 표시
            priceVariationChartContainer.style.display = 'block';
            if (priceVariationChart) {
                priceVariationChart.destroy(); // 기존 그래프가 있으면 제거
            }

            priceVariationChart = new Chart(priceVariationCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: `${subInvestment.label} 가격 변동 (원)`,
                        data: priceVariationValues,
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.1,
                        pointRadius: 3,
                        pointBackgroundColor: 'rgba(255, 99, 132, 1)'
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: false,
                            title: {
                                display: true,
                                text: '가격 변동 (원)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return formatCurrency(value);
                                }
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: '연도'
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return ` ${formatCurrency(context.parsed.y)}`;
                                }
                            }
                        },
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: '세부 항목별 가격 변동'
                        }
                    }
                }
            });

        } catch (error) {
            console.error('데이터를 불러오는 중 오류 발생:', error);
            alert('데이터를 불러오는 데 문제가 발생했습니다.');
        }
    });

    // 숫자를 단위에 따라 포맷팅하는 함수
    function formatCurrency(num) {
        if (num >= 1000000000000) { // 1조 이상
            return `${Math.floor(num / 1000000000000)}조 원`;
        } else if (num >= 100000000) { // 1억 이상
            return `${Math.floor(num / 100000000)}억 원`;
        } else if (num >= 10000) { // 1만 이상
            return `${Math.floor(num / 10000)}만 원`;
        } else {
            return `${num}`;
        }
    }
    function formatNumber(num) {
        return Math.round(Number(num)).toLocaleString('ko-KR');
    }
});
