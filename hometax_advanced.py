"""
홈택스 종합소득세 자동화 - 하이브리드 버전 3.0
- 주민등록번호 하이픈 제거
- 오류 시 재시도
- 1개월 버튼 자동 클릭
- 완전 자동화 시도

작성일: 2026-02-10
버전: 3.0 (개선)
"""

import os
import time
from datetime import datetime, timedelta
from pathlib import Path
import sys

# 라이브러리 체크
print("📦 라이브러리 확인 중...")

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.support.ui import Select
    from selenium.common.exceptions import TimeoutException, NoSuchElementException
    print("✅ Selenium 로드 완료")
except ImportError:
    print("❌ Selenium이 설치되지 않았습니다.")
    print("설치: python -m pip install selenium")
    input("Enter 키를 눌러 종료...")
    sys.exit(1)

try:
    from webdriver_manager.chrome import ChromeDriverManager
    print("✅ WebDriver Manager 로드 완료")
except ImportError:
    print("❌ WebDriver Manager가 설치되지 않았습니다.")
    print("설치: python -m pip install webdriver-manager")
    input("Enter 키를 눌러 종료...")
    sys.exit(1)

try:
    import pyautogui
    print("✅ PyAutoGUI 로드 완료")
except ImportError:
    print("❌ PyAutoGUI가 설치되지 않았습니다.")
    print("설치: python -m pip install pyautogui")
    input("Enter 키를 눌러 종료...")
    sys.exit(1)


class HometaxAdvancedAutomation:
    """홈택스 고급 자동화 클래스"""
    
    def __init__(self, download_folder, resident_number):
        self.download_folder = Path(download_folder)
        self.download_folder.mkdir(parents=True, exist_ok=True)
        
        # 주민등록번호에서 하이픈 제거
        self.resident_number = resident_number.replace('-', '').strip()
        
        if len(self.resident_number) != 13:
            print(f"⚠️ 주민등록번호 길이 오류: {len(self.resident_number)}자리 (13자리 필요)")
        
        self.driver = None
        
        # PyAutoGUI 안전 설정
        pyautogui.FAILSAFE = True
        pyautogui.PAUSE = 0.5
    
    def setup_driver(self):
        """Chrome 드라이버 설정"""
        print("\n🔧 Chrome 드라이버 설정 중...")
        
        options = Options()
        prefs = {
            "download.default_directory": str(self.download_folder.absolute()),
            "download.prompt_for_download": False,
            "download.directory_upgrade": True,
            "safebrowsing.enabled": True,
            "plugins.always_open_pdf_externally": True,
            "printing.print_preview_sticky_settings.appState": {
                "recentDestinations": [{
                    "id": "Save as PDF",
                    "origin": "local",
                    "account": ""
                }],
                "selectedDestinationId": "Save as PDF",
                "version": 2
            }
        }
        options.add_experimental_option("prefs", prefs)
        options.add_argument('--start-maximized')
        options.add_argument('--disable-popup-blocking')
        
        try:
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=options)
            print("   ✅ Chrome 드라이버 설정 완료")
            return True
        except Exception as e:
            print(f"   ❌ Chrome 드라이버 설정 실패: {e}")
            return False
    
    def smart_click(self, xpath=None, link_text=None, button_text=None, wait_time=10, retry=3):
        """
        스마트 클릭 - 여러 방법 시도
        """
        for attempt in range(retry):
            try:
                # 방법 1: XPath
                if xpath:
                    try:
                        element = WebDriverWait(self.driver, wait_time).until(
                            EC.element_to_be_clickable((By.XPATH, xpath))
                        )
                        element.click()
                        time.sleep(1)
                        return True
                    except:
                        pass
                
                # 방법 2: Link Text
                if link_text:
                    try:
                        element = WebDriverWait(self.driver, 3).until(
                            EC.element_to_be_clickable((By.PARTIAL_LINK_TEXT, link_text))
                        )
                        element.click()
                        time.sleep(1)
                        return True
                    except:
                        pass
                
                # 방법 3: Button Text
                if button_text:
                    try:
                        element = self.driver.find_element(By.XPATH, f"//button[contains(text(), '{button_text}')] | //input[@value='{button_text}']")
                        element.click()
                        time.sleep(1)
                        return True
                    except:
                        pass
                
            except Exception as e:
                if attempt < retry - 1:
                    time.sleep(1)
                    continue
        
        return False
    
    def input_resident_number(self):
        """주민등록번호 입력 (하이픈 없이)"""
        print(f"\n🔑 주민등록번호 입력: {self.resident_number}")
        
        retry_count = 3
        for attempt in range(retry_count):
            try:
                # 앞자리 (6자리)
                ssn_front = self.resident_number[:6]
                # 뒷자리 (7자리)
                ssn_back = self.resident_number[6:]
                
                print(f"   입력: {ssn_front} + {ssn_back}")
                
                # 앞자리 입력
                try:
                    front_input = self.driver.find_element(By.NAME, "txppTin1")
                    front_input.clear()
                    front_input.send_keys(ssn_front)
                    time.sleep(0.3)
                except:
                    # ID로 시도
                    front_input = self.driver.find_element(By.ID, "txppTin1")
                    front_input.clear()
                    front_input.send_keys(ssn_front)
                    time.sleep(0.3)
                
                # 뒷자리 입력
                try:
                    back_input = self.driver.find_element(By.NAME, "txppTin2")
                    back_input.clear()
                    back_input.send_keys(ssn_back)
                    time.sleep(0.3)
                except:
                    # ID로 시도
                    back_input = self.driver.find_element(By.ID, "txppTin2")
                    back_input.clear()
                    back_input.send_keys(ssn_back)
                    time.sleep(0.3)
                
                print("   ✅ 주민등록번호 입력 완료")
                return True
                
            except Exception as e:
                print(f"   ⚠️ 시도 {attempt + 1}/{retry_count} 실패: {e}")
                if attempt < retry_count - 1:
                    print("   🔄 재시도 중...")
                    time.sleep(1)
                else:
                    print("   ⚠️ 자동 입력 실패. 수동으로 입력해주세요.")
                    input("   입력 완료 후 Enter...")
                    return False
        
        return False
    
    def switch_to_popup(self):
        """팝업 창으로 전환"""
        try:
            # 현재 창 핸들 저장
            main_window = self.driver.current_window_handle
            
            # 모든 창 가져오기
            all_windows = self.driver.window_handles
            
            # 새 창으로 전환
            for window in all_windows:
                if window != main_window:
                    self.driver.switch_to.window(window)
                    time.sleep(1)
                    return True
            
            return False
        except Exception as e:
            print(f"   ⚠️ 팝업 전환 실패: {e}")
            return False
    
    def close_popup_and_return(self):
        """팝업 닫고 메인 창으로 복귀"""
        try:
            # 현재 창 닫기
            self.driver.close()
            time.sleep(0.5)
            
            # 메인 창으로 전환
            self.driver.switch_to.window(self.driver.window_handles[0])
            time.sleep(1)
            return True
        except Exception as e:
            print(f"   ⚠️ 창 전환 실패: {e}")
            return False
    
    def run(self):
        """메인 실행 함수"""
        print("="*70)
        print("🚀 홈택스 종합소득세 자동화 - 개선 버전 3.0")
        print("="*70)
        
        if not self.setup_driver():
            input("Enter 키를 눌러 종료...")
            return
        
        try:
            # 1. 홈택스 접속
            print("\n🌐 홈택스 접속 중...")
            self.driver.get("https://www.hometax.go.kr/")
            print("   ✅ 접속 완료")
            time.sleep(2)
            
            # 2. 로그인
            print("\n🔐 로그인 진행...")
            
            self.smart_click(link_text="로그인")
            time.sleep(2)
            
            self.smart_click(
                xpath="//a[@id='loginBtnCert'] | //button[contains(text(), '공인인증서')]"
            )
            
            print("\n" + "="*70)
            print("⏳ 공인인증서 로그인을 진행해주세요")
            print("="*70)
            input("\n로그인 완료 후 Enter 키를 눌러주세요...")
            
            # 3. 신고/납부 → 종합소득세 → 신고내역 조회
            print("\n📋 메뉴 이동 중...")
            time.sleep(2)
            
            # 신고/납부
            if self.smart_click(xpath="//a[contains(text(), '신고/납부')]", link_text="신고/납부"):
                print("   ✅ 신고/납부 클릭")
            else:
                print("   ⚠️ 수동으로 '신고/납부' 클릭해주세요.")
                input("   클릭 후 Enter...")
            
            time.sleep(2)
            
            # 종합소득세
            if self.smart_click(xpath="//a[contains(text(), '종합소득세')]", link_text="종합소득세"):
                print("   ✅ 종합소득세 클릭")
            else:
                print("   ⚠️ 수동으로 '종합소득세' 클릭해주세요.")
                input("   클릭 후 Enter...")
            
            time.sleep(2)
            
            # 신고내역 조회
            if self.smart_click(
                xpath="//a[contains(text(), '신고내역') or contains(text(), '접수증')]",
                link_text="신고내역"
            ):
                print("   ✅ 신고내역조회 클릭")
            else:
                print("   ⚠️ 수동으로 '신고내역조회(접수증/납부서)' 클릭해주세요.")
                input("   클릭 후 Enter...")
            
            time.sleep(3)
            
            # 4. 주민등록번호 입력
            self.input_resident_number()
            
            # 5. 1개월 버튼 클릭
            print("\n📅 조회기간 설정 (1개월 버튼 클릭)...")
            try:
                # 1개월 버튼 찾기
                one_month_btn = self.driver.find_element(By.XPATH, "//button[contains(text(), '1개월')] | //input[@value='1개월'] | //a[contains(text(), '1개월')]")
                one_month_btn.click()
                print("   ✅ 1개월 버튼 클릭 완료")
                time.sleep(1)
            except:
                print("   ⚠️ 1개월 버튼을 찾을 수 없습니다. 수동으로 설정해주세요.")
                input("   설정 후 Enter...")
            
            # 6. 신고서 종류 선택
            print("\n📝 신고서 종류 확인 및 선택...")
            try:
                select_element = self.driver.find_element(By.NAME, "dclrFormCode")
                select = Select(select_element)
                
                # 현재 선택된 값 확인
                selected = select.first_selected_option.text
                print(f"   현재 선택: {selected}")
                
                # 토지등매매차익 찾기
                found = False
                for option in select.options:
                    if "토지등매매차익" in option.text or "예정신고" in option.text:
                        select.select_by_visible_text(option.text)
                        print(f"   ✅ 선택: {option.text}")
                        found = True
                        break
                
                if not found:
                    print("   ⚠️ 해당 신고서 종류를 찾을 수 없습니다. 수동으로 선택해주세요.")
                    input("   선택 후 Enter...")
                    
            except Exception as e:
                print(f"   ⚠️ 신고서 종류 선택 실패: {e}")
                print("   수동으로 선택해주세요.")
                input("   선택 후 Enter...")
            
            # 7. 조회 버튼 클릭
            print("\n🔍 조회 버튼 클릭...")
            if self.smart_click(
                xpath="//button[contains(text(), '조회')] | //input[@value='조회']",
                button_text="조회"
            ):
                print("   ✅ 조회 버튼 클릭 완료")
            else:
                print("   ⚠️ 수동으로 '조회' 버튼 클릭해주세요.")
                input("   클릭 후 Enter...")
            
            time.sleep(3)
            
            # 8. 조회 결과에서 주민번호 앞자리 대조
            print("\n🔍 조회 결과 확인 중...")
            print(f"   주민번호 앞자리 확인: {self.resident_number[:6]}")
            
            try:
                # 테이블에서 주민번호 앞자리 찾기
                page_text = self.driver.page_source
                if self.resident_number[:6] in page_text:
                    print("   ✅ 주민번호 앞자리 일치 확인")
                else:
                    print("   ⚠️ 주민번호 앞자리를 찾을 수 없습니다.")
            except:
                pass
            
            # 9. 접수번호 클릭
            print("\n📋 접수번호 클릭...")
            try:
                # 접수번호 링크 찾기 (여러 방법 시도)
                receipt_link = None
                
                try:
                    # 방법 1: 클래스로 찾기
                    receipt_link = self.driver.find_element(By.XPATH, "//a[contains(@class, 'receipt') or contains(@onclick, 'receipt')]")
                except:
                    try:
                        # 방법 2: 테이블의 첫 번째 링크
                        receipt_link = self.driver.find_element(By.XPATH, "//table//tbody//tr[1]//a")
                    except:
                        # 방법 3: 숫자로 시작하는 링크
                        receipt_link = self.driver.find_element(By.XPATH, "//a[starts-with(text(), '2')]")
                
                if receipt_link:
                    receipt_link.click()
                    print("   ✅ 접수번호 클릭 완료")
                    time.sleep(2)
                else:
                    print("   ⚠️ 접수번호를 찾을 수 없습니다. 수동으로 클릭해주세요.")
                    input("   클릭 후 Enter...")
                    
            except Exception as e:
                print(f"   ⚠️ 접수번호 클릭 실패: {e}")
                print("   수동으로 클릭해주세요.")
                input("   클릭 후 Enter...")
            
            # 10. 팝업으로 전환
            print("\n🪟 팝업 창으로 전환...")
            if self.switch_to_popup():
                print("   ✅ 팝업 전환 완료")
            else:
                print("   ⚠️ 팝업 전환 실패")
            
            time.sleep(2)
            
            # 11. 개인정보 공개 → 적용
            print("\n🔓 개인정보 공개 클릭...")
            try:
                # 개인정보 공개 체크박스
                privacy_checkbox = self.driver.find_element(By.XPATH, "//input[@type='checkbox' and (contains(@id, 'privacy') or contains(@name, 'privacy'))]")
                if not privacy_checkbox.is_selected():
                    privacy_checkbox.click()
                    print("   ✅ 개인정보 공개 체크")
                    time.sleep(0.5)
                
                # 적용 버튼
                apply_btn = self.driver.find_element(By.XPATH, "//button[contains(text(), '적용')] | //input[@value='적용']")
                apply_btn.click()
                print("   ✅ 적용 버튼 클릭")
                time.sleep(2)
                
            except Exception as e:
                print(f"   ⚠️ 개인정보 공개 처리 실패: {e}")
                print("   수동으로 진행해주세요.")
                input("   완료 후 Enter...")
            
            # 12. 종합소득세 신고서 접수증 화면 닫기 (있다면)
            print("\n❌ 접수증 화면 닫기...")
            try:
                close_btn = self.driver.find_element(By.XPATH, "//button[contains(text(), '닫기')] | //input[@value='닫기']")
                close_btn.click()
                print("   ✅ 접수증 화면 닫기 완료")
                time.sleep(1)
            except:
                print("   (접수증 화면 없음 또는 이미 닫힘)")
            
            # 13. 일괄출력 버튼 클릭
            print("\n🖨️ 일괄출력 버튼 클릭...")
            try:
                print_all_btn = self.driver.find_element(By.XPATH, "//button[contains(text(), '일괄출력')] | //input[@value='일괄출력'] | //a[contains(text(), '일괄출력')]")
                print_all_btn.click()
                print("   ✅ 일괄출력 버튼 클릭 완료")
                time.sleep(3)
                
            except Exception as e:
                print(f"   ⚠️ 일괄출력 버튼 찾기 실패: {e}")
                print("   수동으로 클릭해주세요.")
                input("   클릭 후 Enter...")
            
            # 14. 인쇄 창 대기 및 인쇄
            print("\n🖨️ 인쇄 창 대기 중...")
            time.sleep(3)
            
            print("\n💾 PDF 저장 중...")
            print("   Ctrl+P로 인쇄 대화상자 열기...")
            
            # Ctrl+P (인쇄)
            pyautogui.hotkey('ctrl', 'p')
            time.sleep(2)
            
            # Enter (저장)
            pyautogui.press('enter')
            time.sleep(2)
            
            print(f"   ✅ PDF 저장 완료 (예상 위치: {self.download_folder})")
            
            # 15. 팝업 닫고 메인으로 복귀
            print("\n🔙 메인 창으로 복귀...")
            self.close_popup_and_return()
            
            # 16. 납부서 클릭 (선택사항)
            print("\n" + "="*70)
            print("📋 납부서 다운로드")
            print("="*70)
            
            choice = input("\n납부서도 다운로드하시겠습니까? (y/n): ").strip().lower()
            
            if choice == 'y':
                print("\n💳 납부서 클릭...")
                try:
                    payment_btn = self.driver.find_element(By.XPATH, "//button[contains(text(), '납부서')] | //a[contains(text(), '납부서')]")
                    payment_btn.click()
                    print("   ✅ 납부서 버튼 클릭")
                    time.sleep(2)
                    
                    # 팝업 전환
                    self.switch_to_popup()
                    time.sleep(2)
                    
                    # 인쇄
                    print("   🖨️ 인쇄 중...")
                    pyautogui.hotkey('ctrl', 'p')
                    time.sleep(2)
                    pyautogui.press('enter')
                    time.sleep(2)
                    
                    print("   ✅ 납부서 저장 완료")
                    
                    # 팝업 닫기
                    self.close_popup_and_return()
                    
                except Exception as e:
                    print(f("   ⚠️ 납부서 처리 실패: {e}")
                    print("   수동으로 진행해주세요.")
            
            # 17. 결과 확인
            print("\n" + "="*70)
            print("✅ 작업 완료!")
            print(f"📂 저장 위치: {self.download_folder}")
            print("="*70)
            
            files = list(self.download_folder.glob('*.pdf'))
            if files:
                print(f"\n📄 저장된 파일: {len(files)}개")
                for idx, file in enumerate(files, 1):
                    print(f"   {idx}. {file.name}")
            else:
                print("\n⚠️ PDF 파일이 없습니다.")
                print("   Chrome 다운로드 폴더를 확인해주세요.")
        
        except Exception as e:
            print(f"\n❌ 오류 발생: {e}")
            import traceback
            traceback.print_exc()
        
        finally:
            input("\nEnter 키를 눌러 브라우저를 닫고 종료합니다...")
            if self.driver:
                self.driver.quit()
            print("🔚 프로그램 종료")


def main():
    print("""
    ╔════════════════════════════════════════════════════════════╗
    ║   홈택스 종합소득세 자동화 - 개선 버전 3.0                ║
    ║                                                            ║
    ║   ✅ 주민등록번호 하이픈 제거                              ║
    ║   ✅ 오류 시 재시도                                        ║
    ║   ✅ 1개월 버튼 자동 클릭                                  ║
    ║   ✅ 완전 자동화 시도                                      ║
    ╚════════════════════════════════════════════════════════════╝
    """)
    
    print("📂 다운로드 기본 경로 설정")
    base_path = input("   다운로드 경로 입력 (Enter = 기본값): ").strip()
    
    if not base_path:
        base_path = "C:/내부페이지/홈택스_종합소득세"
    
    today = datetime.now().strftime("%Y%m%d")
    download_folder = Path(base_path) / today
    
    print("\n👤 주민등록번호 입력")
    print("   형식: 8806161074616 (하이픈 없이)")
    resident_number = input("   주민등록번호: ").strip()
    
    if not resident_number:
        print("❌ 주민등록번호는 필수입니다.")
        input("Enter 키를 눌러 종료...")
        return
    
    # 하이픈 자동 제거
    resident_number = resident_number.replace('-', '')
    
    if len(resident_number) != 13:
        print(f"⚠️ 주민등록번호는 13자리여야 합니다. (입력: {len(resident_number)}자리)")
        retry = input("그래도 계속 진행하시겠습니까? (y/n): ").strip().lower()
        if retry != 'y':
            return
    
    print(f"\n✅ 다운로드 폴더: {download_folder}")
    print(f"✅ 주민등록번호: {resident_number[:6]}*******")
    
    automation = HometaxAdvancedAutomation(download_folder, resident_number)
    automation.run()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n프로그램이 사용자에 의해 중단되었습니다.")
    except Exception as e:
        print(f"\n❌ 예상치 못한 오류: {e}")
        import traceback
        traceback.print_exc()
        input("Enter 키를 눌러 종료...")
