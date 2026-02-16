"""
홈택스 신고자료 자동 다운로드 스크립트
- 공인인증서 로그인
- 신고자료 다운로드
- 폴더 자동 생성 및 정리

작성일: 2024-02-09
"""

import os
import time
import shutil
from datetime import datetime
from pathlib import Path

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.chrome.options import Options
except ImportError:
    print("❌ Selenium이 설치되지 않았습니다.")
    print("📦 설치 명령어: pip install selenium")
    exit(1)


class HometaxAutoDownloader:
    """홈택스 자동 다운로드 클래스"""
    
    def __init__(self, download_base_path="D:/홈택스_신고자료"):
        """
        초기화
        
        Args:
            download_base_path: 파일을 저장할 기본 경로
        """
        self.download_base_path = download_base_path
        self.driver = None
        self.wait = None
        
        # 다운로드 폴더 생성
        os.makedirs(self.download_base_path, exist_ok=True)
        
    def setup_driver(self):
        """크롬 드라이버 설정"""
        print("🔧 크롬 브라우저 설정 중...")
        
        # 크롬 옵션 설정
        chrome_options = Options()
        
        # 다운로드 경로 설정
        prefs = {
            "download.default_directory": self.download_base_path,
            "download.prompt_for_download": False,
            "download.directory_upgrade": True,
            "safebrowsing.enabled": True
        }
        chrome_options.add_experimental_option("prefs", prefs)
        
        # 브라우저 크기 설정
        chrome_options.add_argument("--start-maximized")
        
        # 드라이버 생성
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            self.wait = WebDriverWait(self.driver, 20)
            print("✅ 크롬 브라우저 준비 완료!")
        except Exception as e:
            print(f"❌ 크롬 드라이버 오류: {e}")
            print("💡 해결 방법:")
            print("   1. Chrome 브라우저가 설치되어 있는지 확인")
            print("   2. ChromeDriver 다운로드: https://chromedriver.chromium.org/")
            print("   3. ChromeDriver를 PATH에 추가")
            raise
            
    def open_hometax(self):
        """홈택스 웹사이트 열기"""
        print("\n🌐 홈택스 접속 중...")
        self.driver.get("https://www.hometax.go.kr")
        time.sleep(3)
        print("✅ 홈택스 접속 완료!")
        
    def login_with_cert(self):
        """공인인증서 로그인"""
        print("\n🔐 공인인증서 로그인 시작...")
        
        try:
            # 로그인 버튼 클릭
            print("   ⏳ 로그인 페이지로 이동 중...")
            
            # 방법 1: 메인 화면의 로그인 버튼
            try:
                login_btn = self.wait.until(
                    EC.element_to_be_clickable((By.LINK_TEXT, "로그인"))
                )
                login_btn.click()
                time.sleep(2)
            except:
                print("   ⚠️ 로그인 버튼을 찾을 수 없습니다. 직접 로그인 페이지로 이동합니다.")
                self.driver.get("https://www.hometax.go.kr/websquare/websquare.html?w2xPath=/ui/pp/index_pp.xml")
                time.sleep(2)
            
            # 공인인증서 로그인 버튼 찾기
            print("   ⏳ 공인인증서 로그인 버튼 찾는 중...")
            
            try:
                # 공인인증서 로그인 버튼 클릭
                cert_login_btn = self.wait.until(
                    EC.element_to_be_clickable((By.XPATH, "//*[contains(text(), '공동인증서')]"))
                )
                cert_login_btn.click()
                time.sleep(2)
            except:
                print("   ℹ️ 자동으로 공인인증서 버튼을 찾지 못했습니다.")
            
            # 사용자 수동 로그인 대기
            print("\n" + "="*60)
            print("👤 공인인증서를 선택하고 비밀번호를 입력해주세요.")
            print("⏳ 로그인 완료까지 최대 60초 대기합니다...")
            print("="*60 + "\n")
            
            # 로그인 완료 대기 (최대 60초)
            for i in range(60, 0, -5):
                print(f"   ⏱️ 남은 시간: {i}초")
                time.sleep(5)
                
                # 로그인 성공 여부 확인
                if "main" in self.driver.current_url or "index" in self.driver.current_url:
                    print("✅ 로그인 완료!")
                    return True
                    
            print("⚠️ 로그인 시간이 초과되었습니다. 계속 진행합니다...")
            return True
            
        except Exception as e:
            print(f"❌ 로그인 중 오류: {e}")
            print("💡 수동으로 로그인을 진행해주세요.")
            time.sleep(30)  # 추가 대기
            return True
            
    def navigate_to_report_page(self):
        """신고자료 페이지로 이동"""
        print("\n📄 신고자료 메뉴로 이동 중...")
        
        try:
            # 조회/발급 메뉴
            print("   ⏳ 조회/발급 메뉴 찾는 중...")
            
            # 여러 방법 시도
            menu_found = False
            
            # 방법 1: 텍스트로 찾기
            try:
                menu = self.wait.until(
                    EC.element_to_be_clickable((By.LINK_TEXT, "조회/발급"))
                )
                menu.click()
                time.sleep(2)
                menu_found = True
            except:
                pass
            
            # 방법 2: Partial 텍스트로 찾기
            if not menu_found:
                try:
                    menu = self.driver.find_element(By.PARTIAL_LINK_TEXT, "조회")
                    menu.click()
                    time.sleep(2)
                    menu_found = True
                except:
                    pass
            
            if not menu_found:
                print("   ⚠️ 메뉴를 자동으로 찾지 못했습니다.")
                print("   👤 수동으로 '조회/발급' 메뉴를 클릭해주세요.")
                time.sleep(10)
            
            # 신고자료 조회 메뉴
            print("   ⏳ 신고자료조회 메뉴 찾는 중...")
            
            try:
                submenu = self.wait.until(
                    EC.element_to_be_clickable((By.PARTIAL_LINK_TEXT, "신고자료"))
                )
                submenu.click()
                time.sleep(3)
                print("✅ 신고자료 페이지 이동 완료!")
            except:
                print("   ⚠️ 신고자료 메뉴를 찾지 못했습니다.")
                print("   👤 수동으로 '신고자료조회' 메뉴를 클릭해주세요.")
                time.sleep(10)
                
        except Exception as e:
            print(f"❌ 메뉴 이동 중 오류: {e}")
            print("💡 수동으로 신고자료 페이지로 이동해주세요.")
            time.sleep(15)
            
    def download_report(self, year=None, month=None):
        """
        신고자료 다운로드
        
        Args:
            year: 연도 (기본값: 현재 연도)
            month: 월 (기본값: 현재 월)
        """
        if year is None:
            year = datetime.now().year
        if month is None:
            month = datetime.now().month
            
        print(f"\n📥 {year}년 {month}월 신고자료 다운로드 중...")
        
        try:
            # 기간 설정
            start_date = f"{year}{month:02d}01"
            end_date = f"{year}{month:02d}31"
            
            print(f"   📅 조회 기간: {start_date} ~ {end_date}")
            
            # 날짜 입력 (홈택스 화면 구조에 따라 조정 필요)
            print("   ⏳ 조회 조건 설정 중...")
            time.sleep(2)
            
            # 조회 버튼 클릭
            print("   ⏳ 조회 버튼 클릭...")
            try:
                search_btn = self.driver.find_element(By.XPATH, "//*[contains(text(), '조회')]")
                search_btn.click()
                time.sleep(3)
            except:
                print("   ⚠️ 조회 버튼을 찾지 못했습니다.")
                print("   👤 수동으로 조회 버튼을 클릭해주세요.")
                time.sleep(10)
            
            # 다운로드 버튼 클릭
            print("   ⏳ 다운로드 버튼 클릭...")
            try:
                # Excel 다운로드 버튼 찾기
                download_btn = self.driver.find_element(By.XPATH, "//*[contains(text(), '엑셀') or contains(text(), '다운로드')]")
                download_btn.click()
                print("   ⏳ 파일 다운로드 중... (최대 30초 대기)")
                time.sleep(30)
                print("✅ 다운로드 완료!")
            except:
                print("   ⚠️ 다운로드 버튼을 찾지 못했습니다.")
                print("   👤 수동으로 다운로드 버튼을 클릭해주세요.")
                time.sleep(30)
                
        except Exception as e:
            print(f"❌ 다운로드 중 오류: {e}")
            print("💡 수동으로 다운로드를 진행해주세요.")
            time.sleep(30)
            
    def organize_files(self, year=None, month=None):
        """
        다운로드된 파일 정리
        
        Args:
            year: 연도
            month: 월
        """
        if year is None:
            year = datetime.now().year
        if month is None:
            month = datetime.now().month
            
        print(f"\n📁 파일 정리 중...")
        
        # 폴더명 생성
        folder_name = f"{year}년{month:02d}월_홈택스신고자료_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        target_folder = os.path.join(self.download_base_path, folder_name)
        
        # 폴더 생성
        os.makedirs(target_folder, exist_ok=True)
        print(f"   ✅ 폴더 생성: {folder_name}")
        
        # 다운로드 폴더에서 최근 파일 찾기
        download_folder = str(Path.home() / "Downloads")
        
        try:
            files = os.listdir(download_folder)
            
            # 최근 30분 이내에 다운로드된 파일 찾기
            current_time = time.time()
            recent_files = []
            
            for file in files:
                file_path = os.path.join(download_folder, file)
                if os.path.isfile(file_path):
                    # 파일 수정 시간 확인
                    file_time = os.path.getmtime(file_path)
                    if current_time - file_time < 1800:  # 30분 = 1800초
                        # 홈택스 관련 파일 필터링
                        if any(keyword in file.lower() for keyword in ['신고', 'hometax', 'excel', 'xls', 'xlsx', 'zip']):
                            recent_files.append(file)
            
            if recent_files:
                print(f"   📦 다운로드된 파일 {len(recent_files)}개 발견:")
                for file in recent_files:
                    src = os.path.join(download_folder, file)
                    dst = os.path.join(target_folder, file)
                    
                    try:
                        shutil.move(src, dst)
                        print(f"      ✅ 이동: {file}")
                    except Exception as e:
                        print(f"      ⚠️ 파일 이동 실패 ({file}): {e}")
                        # 복사 시도
                        try:
                            shutil.copy2(src, dst)
                            print(f"      ✅ 복사: {file}")
                        except:
                            pass
                
                print(f"\n✅ 파일 정리 완료!")
                print(f"📂 저장 위치: {target_folder}")
            else:
                print("   ⚠️ 최근 다운로드된 파일을 찾지 못했습니다.")
                print(f"   💡 다운로드 폴더를 확인해주세요: {download_folder}")
                
        except Exception as e:
            print(f"❌ 파일 정리 중 오류: {e}")
            print(f"💡 다운로드 폴더 수동 확인: {download_folder}")
            
    def run(self, year=None, month=None):
        """
        전체 프로세스 실행
        
        Args:
            year: 연도 (기본값: 현재 연도)
            month: 월 (기본값: 현재 월)
        """
        print("\n" + "="*60)
        print("🤖 홈택스 신고자료 자동 다운로드 시작")
        print("="*60)
        
        try:
            # 1. 드라이버 설정
            self.setup_driver()
            
            # 2. 홈택스 접속
            self.open_hometax()
            
            # 3. 공인인증서 로그인
            self.login_with_cert()
            
            # 4. 신고자료 페이지 이동
            self.navigate_to_report_page()
            
            # 5. 신고자료 다운로드
            self.download_report(year, month)
            
            # 6. 파일 정리
            self.organize_files(year, month)
            
            print("\n" + "="*60)
            print("🎉 모든 작업이 완료되었습니다!")
            print("="*60)
            
            # 5초 후 브라우저 닫기
            print("\n⏳ 5초 후 브라우저를 닫습니다...")
            time.sleep(5)
            
        except KeyboardInterrupt:
            print("\n⚠️ 사용자가 작업을 중단했습니다.")
            
        except Exception as e:
            print(f"\n❌ 오류 발생: {e}")
            print("💡 브라우저를 열어둔 상태로 수동 작업을 진행해주세요.")
            input("\n작업을 완료한 후 Enter를 눌러 종료하세요...")
            
        finally:
            # 드라이버 종료
            if self.driver:
                self.driver.quit()
                print("✅ 브라우저 종료 완료")


def main():
    """메인 실행 함수"""
    print("\n" + "="*60)
    print("🤖 홈택스 신고자료 자동 다운로드")
    print("="*60)
    
    # 사용자 입력
    print("\n📅 다운로드할 신고자료의 기간을 입력하세요.")
    print("   (엔터를 누르면 현재 월의 자료를 다운로드합니다)")
    
    year_input = input("\n연도 (예: 2024): ").strip()
    month_input = input("월 (예: 1): ").strip()
    
    year = int(year_input) if year_input else None
    month = int(month_input) if month_input else None
    
    # 다운로드 경로 설정
    print("\n📂 파일을 저장할 경로를 입력하세요.")
    print("   (엔터를 누르면 기본 경로를 사용합니다: D:/홈택스_신고자료)")
    
    path_input = input("\n저장 경로: ").strip()
    download_path = path_input if path_input else "D:/홈택스_신고자료"
    
    print(f"\n✅ 설정 완료!")
    print(f"   연도: {year if year else datetime.now().year}")
    print(f"   월: {month if month else datetime.now().month}")
    print(f"   저장 경로: {download_path}")
    
    input("\n준비되었으면 Enter를 눌러 시작하세요...")
    
    # 자동화 실행
    downloader = HometaxAutoDownloader(download_path)
    downloader.run(year, month)


if __name__ == "__main__":
    main()
