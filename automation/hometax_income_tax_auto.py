"""
홈택스 종합소득세 신고내역 자동 다운로드
- 신고서 및 납부서 PDF 자동 저장
- 조회 날짜별 폴더 자동 생성

작성일: 2026-02-10
"""

import os
import time
from datetime import datetime, timedelta
from pathlib import Path

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.support.ui import Select
    from selenium.webdriver.common.keys import Keys
    print("✅ Selenium 로드 완료")
except ImportError:
    print("❌ Selenium이 설치되지 않았습니다.")
    print("설치: pip install selenium")
    input("Enter 키를 눌러 종료...")
    exit(1)

try:
    from webdriver_manager.chrome import ChromeDriverManager
    print("✅ WebDriver Manager 로드 완료")
except ImportError:
    print("❌ WebDriver Manager가 설치되지 않았습니다.")
    print("설치: pip install webdriver-manager")
    input("Enter 키를 눌러 종료...")
    exit(1)


def main():
    print("""
    ╔══════════════════════════════════════════════════════╗
    ║   홈택스 종합소득세 신고내역 자동 다운로드           ║
    ║   - 신고서 PDF 자동 저장                             ║
    ║   - 납부서 PDF 자동 저장                             ║
    ║   - 조회날짜별 폴더 자동 생성                        ║
    ╚══════════════════════════════════════════════════════╝
    """)
    
    # 1. 기본 설정 입력
    print("📂 다운로드 기본 경로 설정")
    print("   예시: C:/내부페이지/홈택스_종합소득세")
    base_path = input("   다운로드 경로 입력 (Enter = 기본값): ").strip()
    
    if not base_path:
        base_path = "C:/내부페이지/홈택스_종합소득세"
    
    base_folder = Path(base_path)
    base_folder.mkdir(parents=True, exist_ok=True)
    
    print("\n👤 주민등록번호 입력")
    print("   형식: 123456-1234567")
    resident_number = input("   주민등록번호: ").strip()
    
    if not resident_number:
        print("❌ 주민등록번호는 필수입니다.")
        input("Enter 키를 눌러 종료...")
        return
    
    # 조회 날짜 기준 폴더명 생성
    today = datetime.now()
    folder_name = today.strftime("%Y%m%d")
    download_folder = base_folder / folder_name
    download_folder.mkdir(parents=True, exist_ok=True)
    
    print(f"\n✅ 다운로드 폴더: {download_folder}")
    
    # 2. Chrome 드라이버 설정
    print("\n🔧 Chrome 드라이버 설정 중...")
    
    options = Options()
    
    # PDF 자동 저장 설정
    prefs = {
        "download.default_directory": str(download_folder.absolute()),
        "download.prompt_for_download": False,
        "download.directory_upgrade": True,
        "safebrowsing.enabled": True,
        "printing.print_preview_sticky_settings.appState": {
            "recentDestinations": [{
                "id": "Save as PDF",
                "origin": "local",
                "account": ""
            }],
            "selectedDestinationId": "Save as PDF",
            "version": 2
        },
        "savefile.default_directory": str(download_folder.absolute())
    }
    options.add_experimental_option("prefs", prefs)
    
    # 브라우저 옵션
    options.add_argument('--kiosk-printing')  # 인쇄 다이얼로그 없이 바로 인쇄
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--window-size=1920,1080')
    
    # WebDriver Manager로 자동 설치
    try:
        print("   ChromeDriver 자동 다운로드 중...")
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
        driver.set_window_size(1920, 1080)
        print("   ✅ Chrome 드라이버 설정 완료")
    except Exception as e:
        print(f"   ❌ Chrome 드라이버 설정 실패: {e}")
        input("Enter 키를 눌러 종료...")
        return
    
    try:
        # 3. 홈택스 로그인
        print("\n🌐 홈택스 접속 중...")
        driver.get("https://www.hometax.go.kr/")
        print("   ✅ 홈택스 메인 페이지 접속")
        time.sleep(2)
        
        # 로그인 버튼 클릭
        print("\n🔐 로그인 시작...")
        try:
            login_btn = WebDriverWait(driver, 20).until(
                EC.element_to_be_clickable((By.LINK_TEXT, "로그인"))
            )
            login_btn.click()
            print("   ✅ 로그인 버튼 클릭")
            time.sleep(2)
        except Exception as e:
            print(f"   ⚠️ 로그인 버튼을 찾을 수 없습니다: {e}")
        
        # 공인인증서 로그인
        try:
            cert_btn = WebDriverWait(driver, 20).until(
                EC.element_to_be_clickable((By.ID, "loginBtnCert"))
            )
            cert_btn.click()
            print("   ✅ 공인인증서 로그인 클릭")
        except Exception as e:
            print(f"   ⚠️ 공인인증서 버튼을 찾을 수 없습니다: {e}")
        
        print("\n" + "="*60)
        print("⏳ 공인인증서 로그인을 진행해주세요")
        print("   1. 공인인증서 선택")
        print("   2. 비밀번호 입력")
        print("   3. 로그인 완료")
        print("="*60)
        
        input("\n로그인 완료 후 Enter 키를 눌러주세요...")
        
        # 4. 신고/납부 메뉴로 이동
        print("\n📋 신고/납부 메뉴로 이동 중...")
        time.sleep(2)
        
        # 메뉴 클릭 시도 (여러 방법)
        menu_clicked = False
        
        # 방법 1: 텍스트로 찾기
        try:
            menu = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//a[contains(text(), '신고/납부')]"))
            )
            menu.click()
            menu_clicked = True
            print("   ✅ 신고/납부 메뉴 클릭")
            time.sleep(2)
        except:
            pass
        
        # 방법 2: 직접 URL 이동
        if not menu_clicked:
            print("   ⚠️ 메뉴를 찾을 수 없어 직접 이동합니다.")
            driver.get("https://www.hometax.go.kr/ui/pp/index.html")
            time.sleep(3)
        
        # 5. 종합소득세 메뉴 클릭
        print("\n💰 종합소득세 메뉴 클릭...")
        try:
            income_menu = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//a[contains(text(), '종합소득세')]"))
            )
            income_menu.click()
            print("   ✅ 종합소득세 메뉴 클릭")
            time.sleep(2)
        except Exception as e:
            print(f"   ⚠️ 종합소득세 메뉴를 찾을 수 없습니다: {e}")
            print("   수동으로 진행해주세요.")
            input("종합소득세 메뉴 클릭 후 Enter...")
        
        # 6. 신고내역 조회(접수증/납부서) 클릭
        print("\n📄 신고내역 조회(접수증/납부서) 메뉴 클릭...")
        try:
            history_menu = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//a[contains(text(), '신고내역조회') or contains(text(), '접수증/납부서')]"))
            )
            history_menu.click()
            print("   ✅ 신고내역 조회 메뉴 클릭")
            time.sleep(3)
        except Exception as e:
            print(f"   ⚠️ 신고내역 조회 메뉴를 찾을 수 없습니다: {e}")
            print("   수동으로 진행해주세요.")
            input("신고내역 조회 메뉴 클릭 후 Enter...")
        
        # 7. 주민등록번호 입력
        print(f"\n🔑 주민등록번호 입력: {resident_number}")
        try:
            # 주민등록번호 앞자리
            ssn_front = resident_number.split('-')[0]
            ssn_back = resident_number.split('-')[1]
            
            ssn_input1 = driver.find_element(By.NAME, "txppTin1")
            ssn_input1.clear()
            ssn_input1.send_keys(ssn_front)
            
            ssn_input2 = driver.find_element(By.NAME, "txppTin2")
            ssn_input2.clear()
            ssn_input2.send_keys(ssn_back)
            
            print("   ✅ 주민등록번호 입력 완료")
            time.sleep(1)
        except Exception as e:
            print(f"   ⚠️ 주민등록번호 입력 실패: {e}")
            print("   수동으로 입력해주세요.")
            input("주민등록번호 입력 후 Enter...")
        
        # 8. 조회기간 설정 (1개월)
        print("\n📅 조회기간 설정: 1개월")
        try:
            # 종료일: 오늘
            end_date = datetime.now()
            # 시작일: 1개월 전
            start_date = end_date - timedelta(days=30)
            
            # 시작일 입력
            start_input = driver.find_element(By.NAME, "srtDt")
            start_input.clear()
            start_input.send_keys(start_date.strftime("%Y%m%d"))
            
            # 종료일 입력
            end_input = driver.find_element(By.NAME, "endDt")
            end_input.clear()
            end_input.send_keys(end_date.strftime("%Y%m%d"))
            
            print(f"   ✅ 조회기간: {start_date.strftime('%Y-%m-%d')} ~ {end_date.strftime('%Y-%m-%d')}")
            time.sleep(1)
        except Exception as e:
            print(f"   ⚠️ 조회기간 설정 실패: {e}")
            print("   수동으로 설정해주세요.")
            input("조회기간 설정 후 Enter...")
        
        # 9. 신고서 종류 선택: 종합소득세 토지등매매차익 예정신고신고서
        print("\n📝 신고서 종류 선택: 종합소득세 토지등매매차익 예정신고신고서")
        try:
            select_element = driver.find_element(By.NAME, "dclrFormCode")
            select = Select(select_element)
            
            # 옵션 텍스트로 선택
            for option in select.options:
                if "토지등매매차익" in option.text or "예정신고" in option.text:
                    select.select_by_visible_text(option.text)
                    print(f"   ✅ 선택: {option.text}")
                    break
            
            time.sleep(1)
        except Exception as e:
            print(f"   ⚠️ 신고서 종류 선택 실패: {e}")
            print("   수동으로 선택해주세요.")
            input("신고서 종류 선택 후 Enter...")
        
        # 10. 조회 버튼 클릭
        print("\n🔍 조회 버튼 클릭...")
        try:
            search_btn = driver.find_element(By.XPATH, "//button[contains(text(), '조회')] | //input[@value='조회']")
            search_btn.click()
            print("   ✅ 조회 버튼 클릭")
            time.sleep(3)
        except Exception as e:
            print(f("   ⚠️ 조회 버튼 클릭 실패: {e}")
            print("   수동으로 클릭해주세요.")
            input("조회 버튼 클릭 후 Enter...")
        
        # 11. 접수번호 클릭
        print("\n📋 접수번호 클릭...")
        print("   ⚠️ 이 부분부터는 홈택스 구조에 따라 수동 조작이 필요할 수 있습니다.")
        print("\n" + "="*60)
        print("수동 작업 단계:")
        print("1. 접수번호 클릭")
        print("2. 팝업에서 '개인정보 공개' 클릭")
        print("3. '일괄출력' 클릭")
        print("4. '프린트' 버튼 클릭")
        print("   → Ctrl+P 누르고 '저장' 선택")
        print(f"   → PDF 저장 위치: {download_folder}")
        print("5. 팝업 닫고 '납부서' 클릭")
        print("6. 팝업에서 '확인' 클릭")
        print("7. '인쇄' 클릭")
        print("   → Ctrl+P 누르고 '저장' 선택")
        print(f"   → PDF 저장 위치: {download_folder}")
        print("="*60)
        
        print("\n💡 팁: Ctrl+P 단축키로 빠르게 인쇄 대화상자를 열 수 있습니다!")
        print(f"💡 모든 PDF는 {download_folder} 폴더에 저장됩니다!")
        
        input("\n모든 작업 완료 후 Enter 키를 눌러주세요...")
        
        print("\n" + "="*60)
        print("✅ 작업 완료!")
        print(f"📂 저장 위치: {download_folder}")
        print("="*60)
        
        # 저장된 파일 확인
        print("\n📄 다운로드된 파일 목록:")
        files = list(download_folder.glob('*.pdf'))
        if files:
            for idx, file in enumerate(files, 1):
                print(f"   {idx}. {file.name}")
        else:
            print("   (파일이 없습니다. 수동으로 저장했는지 확인해주세요.)")
        
    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        input("\nEnter 키를 눌러 브라우저를 닫고 종료합니다...")
        driver.quit()
        print("🔚 프로그램 종료")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n프로그램이 사용자에 의해 중단되었습니다.")
    except Exception as e:
        print(f"\n❌ 예상치 못한 오류: {e}")
        input("Enter 키를 눌러 종료...")
