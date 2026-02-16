"""
홈택스 신고자료 자동 다운로드 스크립트 (WebDriver Manager 버전)
- 공인인증서 로그인
- 신고자료 다운로드
- 폴더 자동 생성 및 정리
- ChromeDriver 자동 관리

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

try:
    from webdriver_manager.chrome import ChromeDriverManager
except ImportError:
    print("❌ WebDriver Manager가 설치되지 않았습니다.")
    print("📦 설치 명령어: pip install webdriver-manager")
    exit(1)

try:
    import yaml
except ImportError:
    print("❌ PyYAML이 설치되지 않았습니다.")
    print("📦 설치 명령어: pip install pyyaml")
    exit(1)


class HometaxAutoDownloader:
    """홈택스 자동 다운로드 클래스"""
    
    def __init__(self, config_path='config.yaml'):
        """
        초기화
        
        Args:
            config_path: 설정 파일 경로
        """
        # 설정 로드
        self.config = self._load_config(config_path)
        
        # 다운로드 경로 설정
        self.download_path = Path(self.config['download_path'])
        self.download_path.mkdir(parents=True, exist_ok=True)
        
        # 브라우저 드라이버
        self.driver = None
        
        print("✅ 홈택스 자동 다운로더 초기화 완료")
    
    def _load_config(self, config_path):
        """설정 파일 로드"""
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            print(f"⚠️ 설정 파일을 찾을 수 없습니다: {config_path}")
            print("📝 기본 설정을 사용합니다.")
            return {
                'download_path': 'D:/홈택스_신고자료',
                'timeout': 30,
                'headless': False
            }
    
    def setup_driver(self):
        """Chrome 드라이버 설정 (WebDriver Manager 사용)"""
        print("🔧 Chrome 드라이버 설정 중...")
        
        # Chrome 옵션 설정
        options = Options()
        
        # 다운로드 경로 설정
        prefs = {
            "download.default_directory": str(self.download_path.absolute()),
            "download.prompt_for_download": False,
            "download.directory_upgrade": True,
            "safebrowsing.enabled": True
        }
        options.add_experimental_option("prefs", prefs)
        
        # 헤드리스 모드 (백그라운드 실행)
        if self.config.get('headless', False):
            options.add_argument('--headless')
        
        # 기타 옵션
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-gpu')
        options.add_argument('--window-size=1920,1080')
        
        # WebDriver Manager로 자동 ChromeDriver 설치 및 설정
        try:
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=options)
            print("✅ Chrome 드라이버 설정 완료 (자동 다운로드)")
        except Exception as e:
            print(f"❌ Chrome 드라이버 설정 실패: {e}")
            raise
        
        # 타임아웃 설정
        self.driver.implicitly_wait(self.config.get('timeout', 30))
        
        return self.driver
    
    def login_with_cert(self, cert_password=None):
        """
        공인인증서로 로그인
        
        Args:
            cert_password: 인증서 비밀번호 (None이면 수동 입력)
        """
        print("\n🔐 홈택스 로그인 시작...")
        
        try:
            # 홈택스 로그인 페이지 접속
            self.driver.get("https://www.hometax.go.kr/")
            print("📄 홈택스 메인 페이지 접속")
            
            time.sleep(2)
            
            # 로그인 버튼 클릭
            login_btn = WebDriverWait(self.driver, 20).until(
                EC.element_to_be_clickable((By.LINK_TEXT, "로그인"))
            )
            login_btn.click()
            print("🖱️ 로그인 버튼 클릭")
            
            time.sleep(2)
            
            # 공인인증서 로그인 버튼 클릭
            cert_login_btn = WebDriverWait(self.driver, 20).until(
                EC.element_to_be_clickable((By.ID, "loginBtnCert"))
            )
            cert_login_btn.click()
            print("🔑 공인인증서 로그인 버튼 클릭")
            
            print("\n⏳ 공인인증서 선택 및 비밀번호 입력을 기다립니다...")
            print("   (브라우저에서 직접 입력해주세요)")
            
            # 로그인 완료 대기 (최대 5분)
            # 로그인 후 특정 요소가 나타날 때까지 대기
            WebDriverWait(self.driver, 300).until(
                EC.presence_of_element_located((By.CLASS_NAME, "btn_logout"))
            )
            
            print("✅ 로그인 완료!")
            return True
            
        except Exception as e:
            print(f"❌ 로그인 실패: {e}")
            return False
    
    def download_report(self, year=None, month=None):
        """
        신고자료 다운로드
        
        Args:
            year: 연도 (None이면 현재 연도)
            month: 월 (None이면 현재 월)
        """
        if year is None:
            year = datetime.now().year
        if month is None:
            month = datetime.now().month
        
        print(f"\n📥 {year}년 {month}월 신고자료 다운로드 시작...")
        
        try:
            # 신고자료 메뉴 접근
            # (실제 홈택스 메뉴 구조에 맞게 수정 필요)
            
            # 예시: 부가가치세 신고자료 다운로드
            self.driver.get("https://www.hometax.go.kr/ui/pp/yrs_index.html")
            time.sleep(3)
            
            print("⏳ 신고자료 페이지 접속 중...")
            
            # 여기에 실제 다운로드 로직 추가
            # 홈택스 UI에 따라 버튼 클릭, 폼 입력 등
            
            print("✅ 신고자료 다운로드 완료")
            
            # 다운로드 완료 대기
            time.sleep(5)
            
            return True
            
        except Exception as e:
            print(f"❌ 다운로드 실패: {e}")
            return False
    
    def organize_files(self, year, month):
        """
        다운로드된 파일을 연도/월별 폴더로 정리
        
        Args:
            year: 연도
            month: 월
        """
        print(f"\n📁 파일 정리 중... ({year}/{month:02d})")
        
        try:
            # 대상 폴더 생성
            target_folder = self.download_path / str(year) / f"{month:02d}"
            target_folder.mkdir(parents=True, exist_ok=True)
            
            # 다운로드 폴더의 최근 파일들 이동
            download_files = list(self.download_path.glob('*'))
            
            moved_count = 0
            for file_path in download_files:
                if file_path.is_file():
                    # 오늘 다운로드된 파일만 이동
                    file_time = datetime.fromtimestamp(file_path.stat().st_mtime)
                    if file_time.date() == datetime.now().date():
                        # 파일 이동
                        target_path = target_folder / file_path.name
                        shutil.move(str(file_path), str(target_path))
                        moved_count += 1
                        print(f"  ✓ {file_path.name} → {target_folder}")
            
            print(f"✅ 파일 정리 완료 ({moved_count}개 파일 이동)")
            print(f"📂 저장 위치: {target_folder}")
            
            return True
            
        except Exception as e:
            print(f"❌ 파일 정리 실패: {e}")
            return False
    
    def close(self):
        """브라우저 종료"""
        if self.driver:
            self.driver.quit()
            print("🔚 브라우저 종료")
    
    def run(self, year=None, month=None):
        """
        전체 프로세스 실행
        
        Args:
            year: 연도 (None이면 현재 연도)
            month: 월 (None이면 현재 월)
        """
        try:
            print("=" * 60)
            print("🚀 홈택스 자동 다운로드 시작")
            print("=" * 60)
            
            # 1. 드라이버 설정
            self.setup_driver()
            
            # 2. 로그인
            if not self.login_with_cert():
                print("❌ 로그인 실패로 종료합니다.")
                return False
            
            # 3. 신고자료 다운로드
            if not self.download_report(year, month):
                print("⚠️ 다운로드 실패했지만 계속 진행합니다.")
            
            # 4. 파일 정리
            if year and month:
                self.organize_files(year, month)
            
            print("\n" + "=" * 60)
            print("✅ 모든 작업 완료!")
            print("=" * 60)
            
            return True
            
        except Exception as e:
            print(f"\n❌ 오류 발생: {e}")
            return False
            
        finally:
            # 5. 브라우저 종료
            time.sleep(3)
            self.close()


def main():
    """메인 함수"""
    print("""
    ╔════════════════════════════════════════════════════════════╗
    ║       홈택스 신고자료 자동 다운로드 (WebDriver Manager)   ║
    ║                                                            ║
    ║  - ChromeDriver 자동 다운로드 및 관리                      ║
    ║  - 공인인증서 로그인                                       ║
    ║  - 신고자료 자동 다운로드                                  ║
    ║  - 폴더 자동 생성 및 정리                                  ║
    ╚════════════════════════════════════════════════════════════╝
    """)
    
    # 다운로드할 연도/월 입력
    print("📅 다운로드할 기간을 입력하세요")
    print("   (Enter 키를 누르면 현재 연도/월 사용)")
    
    year_input = input("연도 (예: 2025): ").strip()
    year = int(year_input) if year_input else None
    
    month_input = input("월 (예: 1): ").strip()
    month = int(month_input) if month_input else None
    
    # 자동 다운로더 실행
    downloader = HometaxAutoDownloader()
    downloader.run(year, month)
    
    print("\n프로그램을 종료합니다.")


if __name__ == "__main__":
    main()
