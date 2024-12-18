import yfinance as yf
import pandas as pd
import json
from datetime import datetime

# 상위 20개 NASDAQ 100 종목 티커 목록
tickers = [
    "AAPL", "MSFT", "AMZN", "GOOGL", "GOOG", "META",
    "TSLA", "NVDA", "PYPL", "ADBE", "INTC", "CMCSA",
    "PEP", "AVGO", "COST", "CSCO", "TXN", "AMGN",
    "QCOM", "CHTR","INTC"
]

# 투자 항목 리스트 초기화
investments = []

# 데이터 가져올 연도 범위 설정
start_year = 2000
end_year = datetime.today().year

for ticker_symbol in tickers:
    try:
        # yfinance Ticker 객체 생성
        ticker = yf.Ticker(ticker_symbol)
        
        # 데이터 가져오기 (2000-01-01부터 현재까지)
        start_date = f"{start_year}-01-01"
        end_date = datetime.today().strftime('%Y-%m-%d')
        hist = ticker.history(start=start_date, end=end_date)
        
        if hist.empty:
            print(f"데이터 없음: {ticker_symbol}")
            continue
        
        # 연도별 마지막 거래일의 종가 가져오기
        hist['Year'] = hist.index.year
        yearly_close = hist.groupby('Year')['Close'].last()
        
        # 데이터 변환: 연도별 종가를 소수점 두 자리까지 유지
        stock_data = {}
        for year, close_price in yearly_close.items():
            stock_data[str(year)] = round(close_price, 2)
        
        # 기업명 가져오기 (없을 경우 티커 사용)
        company_name = ticker.info.get('shortName', ticker_symbol)
        
        # 종목 정보 추가
        investment = {
            "type": ticker_symbol,
            "label": company_name,
            "data": stock_data
        }
        investments.append(investment)
        
        print(f"성공: {ticker_symbol}")
        
    except Exception as e:
        print(f"오류 발생 {ticker_symbol}: {e}")

# 최종 결과 딕셔너리
result = {"investments": investments}

# JSON 형식으로 저장 또는 출력
# 파일로 저장하려면 아래 주석을 해제하세요.
# with open('investments.json', 'w', encoding='utf-8') as f:
#     json.dump(result, f, indent=4, ensure_ascii=False)

# 콘솔에 출력
print(json.dumps(result, indent=4, ensure_ascii=False))
