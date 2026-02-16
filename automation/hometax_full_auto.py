"""
홈택스 종합소득세 자동화 - A 버전 (완전 자동화)
작성일: 2026-02-10
버전: 4.0 - Full Automation

주요 기능:
- 이미지 인식 + Selenium 하이브리드
- 팝업 자동 처리
- PDF 자동 저장
- 안정성 향상

필수 라이브러리:
pip install selenium webdriver-manager pyautogui pillow
"""

import os
import time
from datetime import datetime, timedelta
from pathlib import Path
import sys

# 의존성 체크
try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.chrome.options import Options
    from webdriver_manager.chrome import ChromeDriverManager
    print("✅ Selenium 로드 완료")
except ImportError:
    print("❌ Selenium이 설치되지 않았습니다.")
    print("설치: pip install selenium webdriver-manager")
    sys.exit(1)

try:
    import pyautogui
    print("✅ PyAutoGUI 로드 완료")
except ImportError:
    print("❌ PyAutoGUI가 설치되지 않았습니다.")
    print("설치: pip install pyautogui pillow")
    sys.exit(1)


class HometaxFullAutomation:
    """홈택스 완전 자동화 클래스"""
    
    def __init__(self, download_folder, resident_number):
        self.download_folder = download_folder
        self.resident_number = resident_number.replace("-", "")  # 하이픈 제거
        
        # 주민등록번호 검증
        if len(self.resident_number) != 13:
            raise ValueError("❌ 주민등록번호는 13자리여야 합니다.")
        
        self.driver = None
        
        # PyAutoGUI 안전 설정
        pyautogui.FAILSAFE = True  # 마우스를 화면 모서리로 이동하면 중단
        pyautogui.PAUSE = 1.0  # 각 동작 사이 1초 대기
        
    def setup_driver(self):
        """Chrome 드라이버 설정"""
        print("\n🔧 Chrome 드라이버 설정 중...")
        
        chrome_options = Options()
        
        # 다운로드 경로 설정
        prefs = {
            "download.default_directory": self.download_folder,
            "download.prompt_for_download": False,
            "plugins.always_open_pdf_externally": True,
            "profile.default_content_setting_values.automatic_downloads": 1
        }
        chrome_options.add_experimental_option("prefs", prefs)
        
        # 창 크기 고정 (해상도 이슈 방지)
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--start-maximized")
        
        try:
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            self.driver.maximize_window()
            print("✅ Chrome 드라이버 설정 완료")
            return True
        except Exception as e:
            print(f"❌ Chrome 드라이버 설정 실패: {e}")
            return False
    
    def wait_and_click(self, by, value, timeout=10, method_name="요소"):
        """요소 대기 후 클릭 (여러 방법 시도)"""
        selectors = []
        
        # 여러 선택자 패턴 시도
        if by == By.XPATH:
            selectors.append((By.XPATH, value))
            # 텍스트 기반 대체 선택자
            if "contains" in value and "text()" in value:
                text = value.split("'")[1] if "'" in value else value.split('"')[1]
                selectors.append((By.LINK_TEXT, text))
                selectors.append((By.PARTIAL_LINK_TEXT, text))
        else:
            selectors.append((by, value))
        
        for sel_by, sel_value in selectors:
            try:
                element = WebDriverWait(self.driver, timeout).until(
                    EC.element_to_be_clickable((sel_by, sel_value))
                )
                element.click()
                print(f"✅ {method_name} 클릭 완료")
                time.sleep(2)  # 클릭 후 대기
                return True
            except Exception as e:
                continue
        
        print(f"⚠️ {method_name} 클릭 실패 - 이미지 인식 시도")
        return False
    
    def find_and_click_by_image(self, image_name, confidence=0.8):
        """이미지 인식으로 버튼 클릭"""
        try:
            # 화면 전체 스크린샷
            screenshot = pyautogui.screenshot()
            
            # 이미지 파일 경로
            image_folder = Path(__file__).parent / "hometax_images"
            image_path = image_folder / image_name
            
            if not image_path.exists():
                print(f"⚠️ 이미지 파일 없음: {image_path}")
                return False
            
            # 이미지 찾기
            location = pyautogui.locateOnScreen(str(image_path), confidence=confidence)
            
            if location:
                # 중앙 클릭
                center = pyautogui.center(location)
                pyautogui.click(center)
                print(f"✅ 이미지 인식 클릭 완료: {image_name}")
                time.sleep(2)
                return True
            else:
                print(f"⚠️ 이미지 찾기 실패: {image_name}")
                return False
                
        except Exception as e:
            print(f"❌ 이미지 인식 오류: {e}")
            return False
    
    def smart_click(self, by, value, timeout=10, method_name="요소", image_name=None):
        """스마트 클릭: Selenium 시도 → 실패 시 이미지 인식"""
        # 1차: Selenium으로 클릭
        if self.wait_and_click(by, value, timeout, method_name):
            return True
        
        # 2차: 이미지 인식으로 클릭
        if image_name:
            if self.find_and_click_by_image(image_name):
                return True
        
        # 3차: 수동 요청
        print(f"❌ {method_name} 자동 클릭 실패")
        print(f"👉 수동으로 '{method_name}' 버튼을 클릭해주세요.")
        input("클릭 후 Enter를 눌러주세요...")
        return False
    
    def input_resident_number_smart(self):
        """주민등록번호 스마트 입력 (재시도 로직)"""
        print("\n📝 주민등록번호 입력 중...")
        
        front = self.resident_number[:6]  # 앞 6자리
        back = self.resident_number[6:]   # 뒤 7자리
        
        # 여러 선택자 패턴
        selectors = [
            (By.ID, "txppTin1"),
            (By.NAME, "txppTin1"),
            (By.XPATH, "//input[@id='txppTin1']"),
            (By.XPATH, "//input[contains(@name, 'txppTin')]"),
        ]
        
        for attempt in range(3):
            print(f"  시도 {attempt + 1}/3...")
            
            for by, value in selectors:
                try:
                    # 앞자리 입력
                    front_input = WebDriverWait(self.driver, 5).until(
                        EC.presence_of_element_located((by, value))
                    )
                    front_input.clear()
                    front_input.send_keys(front)
                    
                    # 뒷자리 입력 (ID를 txppTin2로 변경)
                    back_value = value.replace("1", "2")
                    back_input = self.driver.find_element(by, back_value)
                    back_input.clear()
                    back_input.send_keys(back)
                    
                    print(f"✅ 주민등록번호 입력 완료: {front}-{back}")
                    time.sleep(1)
                    return True
                    
                except Exception:
                    continue
            
            time.sleep(2)  # 재시도 전 대기
        
        # 3회 실패 시 수동 입력
        print("⚠️ 자동 입력 실패")
        print(f"👉 수동으로 주민등록번호를 입력해주세요: {front}-{back}")
        input("입력 후 Enter를 눌러주세요...")
        return False
    
    def click_one_month_button(self):
        """1개월 버튼 클릭"""
        print("\n📅 1개월 버튼 클릭 중...")
        
        selectors = [
            (By.XPATH, "//button[contains(text(), '1개월')]"),
            (By.XPATH, "//a[contains(text(), '1개월')]"),
            (By.XPATH, "//input[@value='1개월']"),
            (By.LINK_TEXT, "1개월"),
        ]
        
        for by, value in selectors:
            try:
                element = WebDriverWait(self.driver, 5).until(
                    EC.element_to_be_clickable((by, value))
                )
                element.click()
                print("✅ 1개월 버튼 클릭 완료")
                time.sleep(1)
                return True
            except Exception:
                continue
        
        print("⚠️ 1개월 버튼 자동 클릭 실패 (수동 필요)")
        return False
    
    def auto_save_pdf(self, filename="신고서"):
        """PDF 자동 저장 (키보드 제어)"""
        print(f"\n💾 {filename} PDF 저장 중...")
        
        try:
            # Ctrl+P (인쇄 다이얼로그)
            time.sleep(2)
            pyautogui.hotkey('ctrl', 'p')
            time.sleep(3)  # 인쇄 창 로딩 대기
            
            # Tab 키로 저장 버튼까지 이동
            pyautogui.press('tab', presses=3, interval=0.5)
            
            # Enter (저장)
            pyautogui.press('enter')
            time.sleep(2)
            
            # 파일명 입력 (자동으로 포커스)
            today = datetime.now().strftime("%Y%m%d")
            pdf_name = f"{filename}_{today}"
            pyautogui.write(pdf_name)
            time.sleep(1)
            
            # Enter (저장 확인)
            pyautogui.press('enter')
            time.sleep(2)
            
            print(f"✅ {filename} PDF 저장 완료: {pdf_name}.pdf")
            return True
            
        except Exception as e:
            print(f"❌ PDF 저장 실패: {e}")
            print(f"👉 수동으로 Ctrl+P → 저장해주세요")
            input("저장 후 Enter를 눌러주세요...")
            return False
    
    def switch_to_popup(self, timeout=10):
        """팝업 창으로 전환"""
        try:
            time.sleep(2)
            # 모든 창 핸들 가져오기
            handles = self.driver.window_handles
            
            if len(handles) > 1:
                # 새 창으로 전환
                self.driver.switch_to.window(handles[-1])
                print("✅ 팝업 창 전환 완료")
                time.sleep(2)
                return True
            else:
                print("⚠️ 팝업 창 없음")
                return False
        except Exception as e:
            print(f"❌ 팝업 전환 실패: {e}")
            return False
    
    def close_popup_and_return(self):
        """팝업 닫고 메인 창으로 복귀"""
        try:
            handles = self.driver.window_handles
            
            if len(handles) > 1:
                # 현재 창 닫기
                self.driver.close()
                # 메인 창으로 복귀
                self.driver.switch_to.window(handles[0])
                print("✅ 팝업 닫기 및 메인 창 복귀 완료")
                time.sleep(2)
                return True
            else:
                print("⚠️ 팝업 없음 (이미 닫힘)")
                return False
        except Exception as e:
            print(f"❌ 팝업 닫기 실패: {e}")
            return False
    
    def run(self):
        """전체 자동화 실행"""
        print("\n" + "="*70)
        print("🏛️  홈택스 종합소득세 자동화 - A 버전 (완전 자동화)")
        print("="*70)
        print(f"📂 저장 위치: {self.download_folder}")
        print(f"🆔 주민등록번호: {self.resident_number[:6]}-{self.resident_number[6:]}")
        print("="*70)
        
        try:
            # 1. 드라이버 설정
            if not self.setup_driver():
                return
            
            # 2. 홈택스 접속
            print("\n🌐 홈택스 접속 중...")
            self.driver.get("https://www.hometax.go.kr/")
            time.sleep(3)
            
            # 3. 로그인
            print("\n🔐 로그인 중...")
            try:
                login_btn = WebDriverWait(self.driver, 10).until(
                    EC.element_to_be_clickable((By.LINK_TEXT, "로그인"))
                )
                login_btn.click()
                time.sleep(2)
                
                cert_btn = WebDriverWait(self.driver, 10).until(
                    EC.element_to_be_clickable((By.ID, "loginBtnCert"))
                )
                cert_btn.click()
                print("✅ 공인인증서 로그인 버튼 클릭")
                time.sleep(3)
            except Exception as e:
                print(f"⚠️ 로그인 버튼 자동 클릭 실패: {e}")
            
            print("\n👤 공인인증서로 로그인해주세요...")
            input("로그인 완료 후 Enter를 눌러주세요...")
            
            # 4. 메뉴 이동: 신고/납부
            print("\n📋 [신고/납부] 메뉴 클릭...")
            self.smart_click(
                By.XPATH, 
                "//a[contains(text(), '신고/납부')]",
                method_name="신고/납부",
                image_name="신고납부.png"
            )
            
            # 5. 종합소득세
            print("\n📄 [종합소득세] 클릭...")
            self.smart_click(
                By.XPATH,
                "//a[contains(text(), '종합소득세')]",
                method_name="종합소득세",
                image_name="종합소득세.png"
            )
            
            # 6. 신고내역 조회(접수증/납부서)
            print("\n🔍 [신고내역 조회] 클릭...")
            self.smart_click(
                By.XPATH,
                "//a[contains(text(), '신고내역') and contains(text(), '접수증')]",
                method_name="신고내역 조회",
                image_name="신고내역조회.png"
            )
            
            # 7. 주민등록번호 입력
            time.sleep(2)
            self.input_resident_number_smart()
            
            # 8. 1개월 버튼 클릭
            self.click_one_month_button()
            
            # 9. 신고서 종류 선택 (종합소득세 토지등매매차익 예정신고)
            print("\n📝 신고서 종류 선택...")
            try:
                select_element = WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.ID, "dclrFormCode"))
                )
                
                # Select 객체 사용
                from selenium.webdriver.support.ui import Select
                select = Select(select_element)
                
                # 텍스트로 선택 시도
                try:
                    select.select_by_visible_text("종합소득세 토지등매매차익 예정신고")
                    print("✅ 신고서 종류 선택 완료")
                except Exception:
                    print("⚠️ 신고서 종류 자동 선택 실패 (수동 필요)")
                
                time.sleep(1)
            except Exception as e:
                print(f"⚠️ 신고서 종류 선택 실패: {e}")
            
            # 10. 조회 버튼 클릭
            print("\n🔍 조회 버튼 클릭...")
            self.smart_click(
                By.XPATH,
                "//button[contains(text(), '조회')]",
                method_name="조회",
                image_name="조회.png"
            )
            
            # 11. 결과 대기
            time.sleep(3)
            print("\n✅ 조회 완료!")
            
            # 12. 접수번호 클릭
            print("\n🔗 접수번호 클릭 중...")
            print("👉 접수번호를 클릭해주세요.")
            input("클릭 후 Enter를 눌러주세요...")
            
            # 13. 팝업 전환
            self.switch_to_popup()
            
            # 14. 개인정보 공개 적용
            print("\n🔓 개인정보 공개 적용 중...")
            self.smart_click(
                By.XPATH,
                "//button[contains(text(), '적용')] | //input[@value='적용']",
                method_name="개인정보 공개 적용"
            )
            
            # 15. 접수증 화면 닫기 시도
            print("\n❌ 접수증 화면 닫기...")
            try:
                close_selectors = [
                    (By.XPATH, "//button[contains(text(), '닫기')]"),
                    (By.XPATH, "//a[contains(text(), '닫기')]"),
                    (By.CLASS_NAME, "close"),
                ]
                
                for by, value in close_selectors:
                    try:
                        close_btn = self.driver.find_element(by, value)
                        close_btn.click()
                        print("✅ 접수증 화면 닫기 완료")
                        time.sleep(2)
                        break
                    except:
                        continue
            except Exception:
                print("⚠️ 접수증 화면 없음 또는 이미 닫힘")
            
            # 16. 일괄출력 버튼 클릭 (강화된 로직)
            print("\n🖨️ 일괄출력 버튼 클릭 중...")
            
            # 여러 선택자 시도
            print_selectors = [
                (By.XPATH, "//button[contains(text(), '일괄출력')]"),
                (By.XPATH, "//a[contains(text(), '일괄출력')]"),
                (By.XPATH, "//input[@value='일괄출력']"),
                (By.XPATH, "//*[contains(text(), '일괄출력')]"),
                (By.LINK_TEXT, "일괄출력"),
                (By.PARTIAL_LINK_TEXT, "일괄출력"),
            ]
            
            clicked = False
            for by, value in print_selectors:
                try:
                    element = WebDriverWait(self.driver, 5).until(
                        EC.element_to_be_clickable((by, value))
                    )
                    element.click()
                    print("✅ 일괄출력 클릭 완료")
                    clicked = True
                    time.sleep(3)
                    break
                except Exception:
                    continue
            
            if not clicked:
                print("⚠️ 일괄출력 버튼 자동 클릭 실패")
                print("👉 수동으로 '일괄출력' 버튼을 클릭해주세요.")
                input("클릭 후 Enter를 눌러주세요...")
            
            # 17. PDF 자동 저장
            self.auto_save_pdf("신고서")
            
            # 18. 납부서 다운로드
            print("\n💳 납부서 다운로드...")
            want_nab = input("납부서도 다운로드하시겠습니까? (y/n): ").lower()
            
            if want_nab == 'y':
                print("👉 납부서 버튼을 클릭해주세요.")
                input("클릭 후 Enter를 눌러주세요...")
                
                # 팝업 확인
                self.smart_click(
                    By.XPATH,
                    "//button[contains(text(), '확인')]",
                    method_name="납부서 팝업 확인"
                )
                
                # PDF 저장
                self.auto_save_pdf("납부서")
            
            # 19. 완료
            print("\n" + "="*70)
            print("✅ 작업 완료!")
            print("="*70)
            print(f"📂 저장 위치: {self.download_folder}")
            
            # 저장된 파일 목록 확인
            download_path = Path(self.download_folder)
            if download_path.exists():
                pdf_files = list(download_path.glob("*.pdf"))
                
                if pdf_files:
                    print("\n📄 다운로드된 파일:")
                    for pdf in pdf_files:
                        print(f"  - {pdf.name}")
                else:
                    print("\n⚠️ PDF 파일이 없습니다.")
                    print(f"Chrome 다운로드 폴더를 확인해주세요:")
                    import os
                    chrome_download = os.path.expanduser("~/Downloads")
                    print(f"  {chrome_download}")
            
            print("\n브라우저를 닫으려면 Enter를 누르세요...")
            input()
            
        except KeyboardInterrupt:
            print("\n\n⚠️ 사용자가 중단했습니다.")
        except Exception as e:
            print(f"\n❌ 오류 발생: {e}")
            import traceback
            traceback.print_exc()
        finally:
            if self.driver:
                self.driver.quit()
                print("✅ 브라우저 종료")


def main():
    """메인 함수"""
    print("\n" + "="*70)
    print("🏛️  홈택스 종합소득세 자동화 - A 버전 (완전 자동화)")
    print("="*70)
    
    # 기본 경로
    default_download_path = "C:/내부페이지/홈택스_종합소득세"
    
    # 오늘 날짜 폴더 생성
    today = datetime.now().strftime("%Y%m%d")
    download_folder = os.path.join(default_download_path, today)
    
    # 폴더 생성
    Path(download_folder).mkdir(parents=True, exist_ok=True)
    
    print(f"\n📂 다운로드 경로: {download_folder}")
    custom_path = input("다른 경로를 사용하시겠습니까? (Enter = 기본값): ").strip()
    
    if custom_path:
        download_folder = os.path.join(custom_path, today)
        Path(download_folder).mkdir(parents=True, exist_ok=True)
    
    # 주민등록번호 입력
    while True:
        resident_number = input("\n🆔 주민등록번호를 입력하세요 (예: 880616-1074616): ").strip()
        
        # 하이픈 제거
        clean_number = resident_number.replace("-", "")
        
        if len(clean_number) == 13 and clean_number.isdigit():
            break
        else:
            print("❌ 올바른 형식이 아닙니다. 13자리 숫자를 입력하세요.")
    
    # 자동화 실행
    automation = HometaxFullAutomation(download_folder, resident_number)
    automation.run()


if __name__ == "__main__":
    main()
