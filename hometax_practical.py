"""
홈택스 종합소득세 자동화 - 실용 버전 4.0
- 팝업 처리 개선
- 사용자 친화적 안내
- 단계별 확인

작성일: 2026-02-10
버전: 4.0 (실용)
"""

import os
import time
from datetime import datetime, timedelta
from pathlib import Path
import sys

print("📦 라이브러리 확인 중...")

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.support.ui import Select
    print("✅ Selenium 로드 완료")
except ImportError:
    print("❌ Selenium 설치: python -m pip install selenium")
    input("Enter...")
    sys.exit(1)

try:
    from webdriver_manager.chrome import ChromeDriverManager
    print("✅ WebDriver Manager 로드 완료")
except ImportError:
    print("❌ WebDriver Manager 설치: python -m pip install webdriver-manager")
    input("Enter...")
    sys.exit(1)

try:
    import pyautogui
    print("✅ PyAutoGUI 로드 완료")
except ImportError:
    print("❌ PyAutoGUI 설치: python -m pip install pyautogui")
    input("Enter...")
    sys.exit(1)


class HometaxPractical:
    """홈택스 실용 자동화"""
    
    def __init__(self, download_folder, resident_number):
        self.download_folder = Path(download_folder)
        self.download_folder.mkdir(parents=True, exist_ok=True)
        self.resident_number = resident_number.replace('-', '').strip()
        self.driver = None
        pyautogui.FAILSAFE = True
        pyautogui.PAUSE = 0.5
    
    def setup_driver(self):
        print("\n🔧 Chrome 설정 중...")
        options = Options()
        
        # 다운로드 설정
        prefs = {
            "download.default_directory": str(self.download_folder.absolute()),
            "download.prompt_for_download": False,
            "plugins.always_open_pdf_externally": True
        }
        options.add_experimental_option("prefs", prefs)
        options.add_argument('--start-maximized')
        
        try:
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=options)
            print("   ✅ 완료")
            return True
        except Exception as e:
            print(f"   ❌ 실패: {e}")
            return False
    
    def wait_and_click(self, xpath=None, link_text=None, wait=10):
        """요소 대기 및 클릭"""
        try:
            if xpath:
                elem = WebDriverWait(self.driver, wait).until(
                    EC.element_to_be_clickable((By.XPATH, xpath))
                )
                elem.click()
                time.sleep(1)
                return True
            if link_text:
                elem = WebDriverWait(self.driver, wait).until(
                    EC.element_to_be_clickable((By.PARTIAL_LINK_TEXT, link_text))
                )
                elem.click()
                time.sleep(1)
                return True
        except:
            return False
    
    def input_ssn(self):
        """주민번호 입력"""
        print(f"\n🔑 주민번호 입력...")
        for attempt in range(3):
            try:
                front = self.resident_number[:6]
                back = self.resident_number[6:]
                
                f_input = self.driver.find_element(By.NAME, "txppTin1")
                f_input.clear()
                f_input.send_keys(front)
                
                b_input = self.driver.find_element(By.NAME, "txppTin2")
                b_input.clear()
                b_input.send_keys(back)
                
                print("   ✅ 입력 완료")
                return True
            except:
                if attempt < 2:
                    print(f"   ⚠️ 재시도 {attempt+1}/3")
                    time.sleep(1)
        
        print("   ⚠️ 수동으로 입력해주세요.")
        input("   입력 후 Enter...")
        return False
    
    def switch_to_new_window(self):
        """새 창으로 전환"""
        try:
            main = self.driver.current_window_handle
            for window in self.driver.window_handles:
                if window != main:
                    self.driver.switch_to.window(window)
                    return True
            return False
        except:
            return False
    
    def run(self):
        print("="*70)
        print("🚀 홈택스 자동화 - 실용 버전 4.0")
        print("="*70)
        
        if not self.setup_driver():
            input("Enter...")
            return
        
        try:
            # 1. 접속
            print("\n🌐 홈택스 접속...")
            self.driver.get("https://www.hometax.go.kr/")
            time.sleep(2)
            
            # 2. 로그인
            print("\n🔐 로그인...")
            self.wait_and_click(link_text="로그인")
            time.sleep(1)
            self.wait_and_click(xpath="//a[@id='loginBtnCert']")
            
            print("\n" + "="*70)
            print("⏳ 공인인증서 로그인 진행")
            print("="*70)
            input("\n로그인 후 Enter...")
            
            # 3. 메뉴 이동
            print("\n📋 메뉴 이동...")
            if not self.wait_and_click(link_text="신고/납부"):
                print("   수동: '신고/납부' 클릭")
                input("   Enter...")
            
            time.sleep(2)
            
            if not self.wait_and_click(link_text="종합소득세"):
                print("   수동: '종합소득세' 클릭")
                input("   Enter...")
            
            time.sleep(2)
            
            if not self.wait_and_click(link_text="신고내역"):
                print("   수동: '신고내역조회' 클릭")
                input("   Enter...")
            
            time.sleep(3)
            
            # 4. 주민번호 입력
            self.input_ssn()
            
            # 5. 1개월 버튼
            print("\n📅 조회기간 (1개월)...")
            try:
                btn = self.driver.find_element(By.XPATH, 
                    "//button[contains(text(), '1개월')] | //a[contains(text(), '1개월')]")
                btn.click()
                print("   ✅ 클릭")
                time.sleep(1)
            except:
                print("   수동: '1개월' 버튼 클릭")
                input("   Enter...")
            
            # 6. 신고서 종류
            print("\n📝 신고서 종류...")
            try:
                sel = Select(self.driver.find_element(By.NAME, "dclrFormCode"))
                for opt in sel.options:
                    if "토지등매매차익" in opt.text:
                        sel.select_by_visible_text(opt.text)
                        print(f"   ✅ {opt.text}")
                        break
            except:
                print("   수동: 신고서 종류 선택")
                input("   Enter...")
            
            # 7. 조회
            print("\n🔍 조회...")
            if not self.wait_and_click(xpath="//button[contains(text(), '조회')]"):
                print("   수동: '조회' 버튼 클릭")
                input("   Enter...")
            
            time.sleep(3)
            
            # 8. 여기부터 사용자 안내 모드
            print("\n" + "="*70)
            print("📋 이제 다음 단계를 따라해주세요:")
            print("="*70)
            print("\n1️⃣ 접수번호 클릭")
            print("   → 새 창(팝업)이 열림")
            input("\n접수번호 클릭 후 Enter...")
            
            # 팝업 전환
            print("\n🪟 팝업 창 전환 중...")
            time.sleep(2)
            if self.switch_to_new_window():
                print("   ✅ 팝업 전환 완료")
            else:
                print("   (수동으로 팝업 확인)")
            
            print("\n2️⃣ 개인정보 공개")
            print("   → 체크박스 클릭")
            print("   → '적용' 버튼 클릭")
            input("\n적용 완료 후 Enter...")
            
            print("\n3️⃣ 일괄출력")
            print("   → '일괄출력' 버튼 찾아서 클릭")
            print("   → 잠시 기다리면 인쇄 창 열림")
            input("\n일괄출력 클릭 후 Enter...")
            
            # PDF 저장 안내
            print("\n4️⃣ PDF 저장")
            print("="*70)
            print("방법 1 (자동):")
            print("   → 지금 Enter 누르면 자동으로 Ctrl+P → Enter")
            print(f"   → 저장 위치: {self.download_folder}")
            print("\n방법 2 (수동):")
            print("   → Ctrl+P 누름")
            print("   → 대상: 'PDF로 저장' 선택")
            print(f"   → 저장 위치: {self.download_folder}")
            print("   → '저장' 클릭")
            print("="*70)
            
            choice = input("\n자동 저장 시도? (y=자동, n=수동): ").lower()
            
            if choice == 'y':
                print("\n💾 자동 저장 시도...")
                time.sleep(1)
                pyautogui.hotkey('ctrl', 'p')
                print("   Ctrl+P 눌림")
                time.sleep(3)
                pyautogui.press('enter')
                print("   Enter 눌림")
                time.sleep(2)
                print("   ✅ 저장 시도 완료")
            else:
                print("\n수동으로 저장해주세요...")
                input("저장 완료 후 Enter...")
            
            # 납부서
            print("\n5️⃣ 납부서 (선택사항)")
            choice = input("\n납부서도 다운로드? (y/n): ").lower()
            
            if choice == 'y':
                print("\n📝 납부서 다운로드:")
                print("   1. 팝업 닫기")
                print("   2. 메인 창에서 '납부서' 버튼 클릭")
                print("   3. 팝업 열리면 '인쇄' 클릭")
                print("   4. Ctrl+P → PDF로 저장")
                input("\n완료 후 Enter...")
            
            # 완료
            print("\n" + "="*70)
            print("✅ 작업 완료!")
            print("="*70)
            
            print(f"\n📂 저장 위치: {self.download_folder}")
            
            # 파일 확인
            pdf_files = list(self.download_folder.glob('*.pdf'))
            if pdf_files:
                print(f"\n📄 저장된 파일: {len(pdf_files)}개")
                for i, f in enumerate(pdf_files, 1):
                    size_kb = f.stat().st_size / 1024
                    print(f"   {i}. {f.name} ({size_kb:.1f} KB)")
            else:
                print("\n⚠️ PDF 파일 없음")
                print("Chrome 다운로드 폴더 확인:")
                print("   → Chrome 주소창: chrome://downloads")
                
                # 시스템 다운로드 폴더 확인
                system_download = Path.home() / "Downloads"
                sys_pdfs = list(system_download.glob('*.pdf'))
                if sys_pdfs:
                    recent = sorted(sys_pdfs, key=lambda x: x.stat().st_mtime, reverse=True)[:3]
                    print(f"\n최근 다운로드 (시스템 폴더):")
                    for f in recent:
                        mod_time = datetime.fromtimestamp(f.stat().st_mtime)
                        print(f"   - {f.name} ({mod_time.strftime('%H:%M:%S')})")
        
        except Exception as e:
            print(f"\n❌ 오류: {e}")
            import traceback
            traceback.print_exc()
        
        finally:
            input("\nEnter로 종료...")
            if self.driver:
                self.driver.quit()


def main():
    print("""
    ╔════════════════════════════════════════════════════════════╗
    ║              홈택스 자동화 - 실용 버전 4.0                 ║
    ║                                                            ║
    ║  🎯 반자동: 자동화 + 사용자 확인                           ║
    ║  ✅ 단계별 안내                                            ║
    ║  ✅ 안정적                                                 ║
    ╚════════════════════════════════════════════════════════════╝
    """)
    
    base_path = input("📂 다운로드 경로 (Enter=기본): ").strip()
    if not base_path:
        base_path = "C:/내부페이지/홈택스_종합소득세"
    
    today = datetime.now().strftime("%Y%m%d")
    download_folder = Path(base_path) / today
    
    print("\n👤 주민등록번호 (하이픈 있어도 됨)")
    ssn = input("   입력: ").strip().replace('-', '')
    
    if len(ssn) != 13:
        print(f"⚠️ {len(ssn)}자리 입력됨 (13자리 필요)")
        if input("계속? (y/n): ").lower() != 'y':
            return
    
    print(f"\n✅ 폴더: {download_folder}")
    print(f"✅ 주민번호: {ssn[:6]}*******")
    
    auto = HometaxPractical(download_folder, ssn)
    auto.run()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n중단됨")
    except Exception as e:
        print(f"\n❌ 오류: {e}")
        input("Enter...")
