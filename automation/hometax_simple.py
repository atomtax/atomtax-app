"""
홈택스 신고자료 자동 다운로드 - 간단 버전
사용법: python hometax_simple.py

작성일: 2024-02-09
"""

import os
import time
from datetime import datetime
from pathlib import Path

# 라이브러리 확인
try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.chrome.options import Options
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
    ╔════════════════════════════════════════════════╗
    ║     홈택스 신고자료 자동 다운로드 - 간단 버전    ║
    ╚════════════════════════════════════════════════╝
    """)
    
    # 1. 다운로드 경로 설정
    print("📂 다운로드 경로 설정")
    print("   예시: C:/Users/hellt/Documents/홈택스_신고자료")
    download_path = input("   다운로드 경로 입력 (Enter = 기본값): ").strip()
    
    if not download_path:
        download_path = "C:/Users/hellt/Documents/홈택스_신고자료"
    
    # 경로 생성
    download_folder = Path(download_path)
    download_folder.mkdir(parents=True, exist_ok=True)
    print(f"   ✅ 다운로드 경로: {download_folder}")
    
    # 2. 연도/월 입력
    print("\n📅 다운로드할 기간")
    year = input("   연도 (예: 2025, Enter = 올해): ").strip()
    year = int(year) if year else datetime.now().year
    
    month = input("   월 (예: 1, Enter = 이번 달): ").strip()
    month = int(month) if month else datetime.now().month
    
    print(f"   ✅ 다운로드 기간: {year}년 {month}월")
    
    # 3. Chrome 드라이버 설정
    print("\n🔧 Chrome 드라이버 설정 중...")
    
    options = Options()
    
    # 다운로드 경로 설정
    prefs = {
        "download.default_directory": str(download_folder.absolute()),
        "download.prompt_for_download": False,
        "download.directory_upgrade": True,
        "safebrowsing.enabled": True
    }
    options.add_experimental_option("prefs", prefs)
    
    # 브라우저 옵션
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--window-size=1920,1080')
    
    # WebDriver Manager로 자동 설치
    try:
        print("   ChromeDriver 자동 다운로드 중...")
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
        print("   ✅ Chrome 드라이버 설정 완료")
    except Exception as e:
        print(f"   ❌ Chrome 드라이버 설정 실패: {e}")
        input("Enter 키를 눌러 종료...")
        return
    
    try:
        # 4. 홈택스 접속
        print("\n🌐 홈택스 접속 중...")
        driver.get("https://www.hometax.go.kr/")
        print("   ✅ 홈택스 메인 페이지 접속")
        
        time.sleep(2)
        
        # 5. 로그인 버튼 클릭
        print("\n🔐 로그인 시작...")
        try:
            login_btn = WebDriverWait(driver, 20).until(
                EC.element_to_be_clickable((By.LINK_TEXT, "로그인"))
            )
            login_btn.click()
            print("   ✅ 로그인 버튼 클릭")
            time.sleep(2)
        except:
            print("   ⚠️ 로그인 버튼을 찾을 수 없습니다. 수동으로 로그인하세요.")
        
        # 6. 공인인증서 로그인
        try:
            cert_btn = WebDriverWait(driver, 20).until(
                EC.element_to_be_clickable((By.ID, "loginBtnCert"))
            )
            cert_btn.click()
            print("   ✅ 공인인증서 로그인 클릭")
        except:
            print("   ⚠️ 공인인증서 버튼을 찾을 수 없습니다. 수동으로 진행하세요.")
        
        # 7. 사용자 입력 대기
        print("\n" + "="*60)
        print("⏳ 공인인증서 로그인을 진행해주세요")
        print("   1. 공인인증서 선택")
        print("   2. 비밀번호 입력")
        print("   3. 로그인 완료")
        print("="*60)
        
        input("\n로그인 완료 후 Enter 키를 눌러주세요...")
        
        # 8. 신고자료 다운로드 안내
        print("\n" + "="*60)
        print("📥 이제 신고자료를 다운로드하세요")
        print("="*60)
        print("\n다운로드 방법:")
        print("1. 홈택스에서 원하는 신고자료 메뉴로 이동")
        print("2. 다운로드 버튼 클릭")
        print("3. 파일이 자동으로 다음 폴더에 저장됩니다:")
        print(f"   📂 {download_folder}")
        
        input("\n다운로드 완료 후 Enter 키를 눌러주세요...")
        
        # 9. 파일 정리
        print(f"\n📁 파일 정리 중... ({year}/{month:02d})")
        
        # 연도/월 폴더 생성
        target_folder = download_folder / str(year) / f"{month:02d}"
        target_folder.mkdir(parents=True, exist_ok=True)
        
        # 다운로드 폴더의 오늘 파일 찾기
        moved_count = 0
        for file_path in download_folder.glob('*'):
            if file_path.is_file():
                # 오늘 다운로드된 파일만
                file_time = datetime.fromtimestamp(file_path.stat().st_mtime)
                if file_time.date() == datetime.now().date():
                    # 파일 이동
                    target_path = target_folder / file_path.name
                    try:
                        file_path.rename(target_path)
                        moved_count += 1
                        print(f"   ✓ {file_path.name} → {target_folder}")
                    except Exception as e:
                        print(f"   ⚠️ {file_path.name} 이동 실패: {e}")
        
        print(f"\n✅ 파일 정리 완료 ({moved_count}개 파일)")
        print(f"📂 저장 위치: {target_folder}")
        
        print("\n" + "="*60)
        print("✅ 모든 작업 완료!")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")
    
    finally:
        # 10. 브라우저 닫기
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
