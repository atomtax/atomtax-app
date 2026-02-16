"""
홈택스 종합소득세 자동화 - 하이브리드 버전
- Selenium + 이미지 인식 + OCR 조합
- 해상도 완전 무관
- 최고의 안정성

작성일: 2026-02-10
버전: 2.0 (하이브리드)
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

try:
    import pytesseract
    from PIL import ImageGrab, Image
    print("✅ OCR 라이브러리 로드 완료")
except ImportError:
    print("⚠️ OCR 라이브러리가 설치되지 않았습니다. (선택사항)")
    print("설치: python -m pip install pytesseract pillow")
    pytesseract = None

try:
    import cv2
    import numpy as np
    print("✅ OpenCV 로드 완료")
except ImportError:
    print("⚠️ OpenCV가 설치되지 않았습니다. (선택사항)")
    print("설치: python -m pip install opencv-python")
    cv2 = None


class HometaxHybridAutomation:
    """홈택스 하이브리드 자동화 클래스"""
    
    def __init__(self, download_folder, resident_number):
        self.download_folder = Path(download_folder)
        self.download_folder.mkdir(parents=True, exist_ok=True)
        self.resident_number = resident_number
        self.driver = None
        self.images_folder = Path("hometax_images")
        self.images_folder.mkdir(exist_ok=True)
        
        # PyAutoGUI 안전 설정
        pyautogui.FAILSAFE = True  # 마우스를 모서리로 이동하면 중단
        pyautogui.PAUSE = 1.0  # 각 동작 후 1초 대기
    
    def setup_driver(self):
        """Chrome 드라이버 설정"""
        print("\n🔧 Chrome 드라이버 설정 중...")
        
        options = Options()
        prefs = {
            "download.default_directory": str(self.download_folder.absolute()),
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
            }
        }
        options.add_experimental_option("prefs", prefs)
        options.add_argument('--start-maximized')
        
        try:
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=options)
            print("   ✅ Chrome 드라이버 설정 완료")
            return True
        except Exception as e:
            print(f"   ❌ Chrome 드라이버 설정 실패: {e}")
            return False
    
    def smart_click(self, xpath=None, link_text=None, image_name=None, ocr_text=None, wait_time=10):
        """
        하이브리드 클릭: Selenium → 이미지 인식 → OCR 순서로 시도
        
        Args:
            xpath: XPath 선택자
            link_text: 링크 텍스트
            image_name: 이미지 파일 이름
            ocr_text: OCR로 찾을 텍스트
            wait_time: 대기 시간
        """
        print(f"\n   🔍 요소 찾기 시도...")
        
        # 방법 1: Selenium (XPath)
        if xpath:
            try:
                print(f"      1️⃣ Selenium (XPath) 시도...")
                element = WebDriverWait(self.driver, wait_time).until(
                    EC.element_to_be_clickable((By.XPATH, xpath))
                )
                element.click()
                print(f"      ✅ Selenium으로 클릭 성공!")
                time.sleep(1)
                return True
            except Exception as e:
                print(f"      ⚠️ Selenium (XPath) 실패")
        
        # 방법 2: Selenium (Link Text)
        if link_text:
            try:
                print(f"      2️⃣ Selenium (Link Text) 시도...")
                element = WebDriverWait(self.driver, 5).until(
                    EC.element_to_be_clickable((By.PARTIAL_LINK_TEXT, link_text))
                )
                element.click()
                print(f"      ✅ Selenium으로 클릭 성공!")
                time.sleep(1)
                return True
            except Exception as e:
                print(f"      ⚠️ Selenium (Link Text) 실패")
        
        # 방법 3: 이미지 인식
        if image_name:
            image_path = self.images_folder / image_name
            if image_path.exists():
                try:
                    print(f"      3️⃣ 이미지 인식 시도...")
                    location = pyautogui.locateOnScreen(str(image_path), confidence=0.8)
                    if location:
                        center = pyautogui.center(location)
                        pyautogui.click(center)
                        print(f"      ✅ 이미지 인식으로 클릭 성공!")
                        time.sleep(1)
                        return True
                except Exception as e:
                    print(f"      ⚠️ 이미지 인식 실패")
        
        # 방법 4: OCR
        if ocr_text and pytesseract:
            try:
                print(f"      4️⃣ OCR 시도...")
                if self.click_by_ocr(ocr_text):
                    print(f"      ✅ OCR로 클릭 성공!")
                    return True
                else:
                    print(f"      ⚠️ OCR 실패")
            except Exception as e:
                print(f"      ⚠️ OCR 실패: {e}")
        
        print(f"      ❌ 모든 방법 실패")
        return False
    
    def click_by_ocr(self, target_text):
        """OCR로 텍스트를 찾아서 클릭"""
        try:
            screenshot = ImageGrab.grab()
            
            # Tesseract 경로 설정 (Windows)
            if sys.platform == 'win32':
                pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
            
            data = pytesseract.image_to_data(screenshot, 
                                             output_type=pytesseract.Output.DICT,
                                             lang='kor+eng')
            
            for i in range(len(data['text'])):
                text = data['text'][i].strip()
                if target_text in text or text in target_text:
                    x = data['left'][i] + data['width'][i] // 2
                    y = data['top'][i] + data['height'][i] // 2
                    pyautogui.click(x, y)
                    time.sleep(1)
                    return True
            
            return False
        except Exception as e:
            return False
    
    def smart_input(self, name=None, id_attr=None, text_value=None):
        """
        하이브리드 입력: Selenium → 직접 입력
        """
        # 방법 1: Selenium (name)
        if name:
            try:
                element = self.driver.find_element(By.NAME, name)
                element.clear()
                element.send_keys(text_value)
                return True
            except:
                pass
        
        # 방법 2: Selenium (id)
        if id_attr:
            try:
                element = self.driver.find_element(By.ID, id_attr)
                element.clear()
                element.send_keys(text_value)
                return True
            except:
                pass
        
        # 방법 3: 직접 입력 (현재 포커스된 요소에)
        try:
            pyautogui.write(text_value, interval=0.1)
            return True
        except:
            return False
    
    def run(self):
        """메인 실행 함수"""
        print("="*70)
        print("🚀 홈택스 종합소득세 자동화 - 하이브리드 버전")
        print("="*70)
        
        # Chrome 설정
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
            
            # 로그인 버튼 클릭
            self.smart_click(
                link_text="로그인",
                ocr_text="로그인"
            )
            time.sleep(2)
            
            # 공인인증서 로그인 버튼
            self.smart_click(
                xpath="//a[@id='loginBtnCert'] | //button[contains(text(), '공인인증서')]",
                image_name="cert_login.png",
                ocr_text="공인인증서"
            )
            
            print("\n" + "="*70)
            print("⏳ 공인인증서 로그인을 진행해주세요")
            print("   1. 공인인증서 선택")
            print("   2. 비밀번호 입력")
            print("   3. 로그인 완료")
            print("="*70)
            input("\n로그인 완료 후 Enter 키를 눌러주세요...")
            
            # 3. 신고/납부 메뉴
            print("\n📋 신고/납부 메뉴로 이동...")
            time.sleep(2)
            
            success = self.smart_click(
                xpath="//a[contains(text(), '신고/납부')]",
                link_text="신고/납부",
                image_name="신고납부.png",
                ocr_text="신고/납부"
            )
            
            if not success:
                print("   ⚠️ 자동 클릭 실패. 수동으로 '신고/납부' 클릭해주세요.")
                input("클릭 후 Enter...")
            
            time.sleep(2)
            
            # 4. 종합소득세
            print("\n💰 종합소득세 메뉴 클릭...")
            
            success = self.smart_click(
                xpath="//a[contains(text(), '종합소득세')]",
                link_text="종합소득세",
                image_name="종합소득세.png",
                ocr_text="종합소득세"
            )
            
            if not success:
                print("   ⚠️ 자동 클릭 실패. 수동으로 '종합소득세' 클릭해주세요.")
                input("클릭 후 Enter...")
            
            time.sleep(2)
            
            # 5. 신고내역 조회
            print("\n📄 신고내역 조회 메뉴 클릭...")
            
            success = self.smart_click(
                xpath="//a[contains(text(), '신고내역') or contains(text(), '접수증')]",
                link_text="신고내역",
                image_name="신고내역조회.png",
                ocr_text="신고내역"
            )
            
            if not success:
                print("   ⚠️ 자동 클릭 실패. 수동으로 '신고내역조회(접수증/납부서)' 클릭해주세요.")
                input("클릭 후 Enter...")
            
            time.sleep(3)
            
            # 6. 주민등록번호 입력
            print(f"\n🔑 주민등록번호 입력: {self.resident_number}")
            
            try:
                ssn_parts = self.resident_number.split('-')
                ssn_front = ssn_parts[0]
                ssn_back = ssn_parts[1]
                
                # 앞자리
                success = self.smart_input(
                    name="txppTin1",
                    id_attr="txppTin1",
                    text_value=ssn_front
                )
                
                time.sleep(0.5)
                
                # 뒷자리
                success = self.smart_input(
                    name="txppTin2",
                    id_attr="txppTin2",
                    text_value=ssn_back
                )
                
                if success:
                    print("   ✅ 주민등록번호 입력 완료")
                else:
                    print("   ⚠️ 자동 입력 실패. 수동으로 입력해주세요.")
                    input("입력 후 Enter...")
                
            except Exception as e:
                print(f"   ⚠️ 주민등록번호 입력 실패. 수동으로 입력해주세요.")
                input("입력 후 Enter...")
            
            # 7. 조회기간 설정
            print("\n📅 조회기간 설정 (1개월)...")
            try:
                end_date = datetime.now()
                start_date = end_date - timedelta(days=30)
                
                start_input = self.driver.find_element(By.NAME, "srtDt")
                start_input.clear()
                start_input.send_keys(start_date.strftime("%Y%m%d"))
                
                end_input = self.driver.find_element(By.NAME, "endDt")
                end_input.clear()
                end_input.send_keys(end_date.strftime("%Y%m%d"))
                
                print(f"   ✅ 조회기간: {start_date.strftime('%Y-%m-%d')} ~ {end_date.strftime('%Y-%m-%d')}")
            except:
                print("   ⚠️ 자동 설정 실패. 수동으로 설정해주세요.")
                input("설정 후 Enter...")
            
            # 8. 신고서 종류 선택
            print("\n📝 신고서 종류 선택...")
            try:
                select_element = self.driver.find_element(By.NAME, "dclrFormCode")
                select = Select(select_element)
                
                for option in select.options:
                    if "토지등매매차익" in option.text or "예정신고" in option.text:
                        select.select_by_visible_text(option.text)
                        print(f"   ✅ 선택: {option.text}")
                        break
            except:
                print("   ⚠️ 자동 선택 실패. 수동으로 선택해주세요.")
                input("선택 후 Enter...")
            
            # 9. 조회 버튼
            print("\n🔍 조회 버튼 클릭...")
            
            success = self.smart_click(
                xpath="//button[contains(text(), '조회')] | //input[@value='조회']",
                image_name="조회.png",
                ocr_text="조회"
            )
            
            if not success:
                print("   ⚠️ 자동 클릭 실패. 수동으로 '조회' 버튼 클릭해주세요.")
                input("클릭 후 Enter...")
            
            time.sleep(3)
            
            # 10. 수동 작업 안내
            print("\n" + "="*70)
            print("📋 이제 수동으로 PDF 저장을 진행해주세요")
            print("="*70)
            print("\n수동 작업 단계:")
            print("1. 접수번호 클릭")
            print("2. 팝업에서 '개인정보 공개' 클릭")
            print("3. '일괄출력' 클릭")
            print("4. '프린트' 버튼 클릭 → Ctrl+P → PDF 저장")
            print(f"   📂 저장 위치: {self.download_folder}")
            print("5. 팝업 닫고 '납부서' 클릭")
            print("6. '인쇄' 클릭 → Ctrl+P → PDF 저장")
            print(f"   📂 저장 위치: {self.download_folder}")
            print("="*70)
            
            input("\n모든 작업 완료 후 Enter 키를 눌러주세요...")
            
            # 11. 결과 확인
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
                print("\n(PDF 파일이 없습니다. 수동으로 저장했는지 확인해주세요.)")
        
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
    ║   홈택스 종합소득세 자동화 - 하이브리드 버전 2.0          ║
    ║                                                            ║
    ║   🚀 Selenium + 이미지 인식 + OCR 조합                     ║
    ║   ✅ 해상도 완전 무관                                      ║
    ║   ✅ 최고의 안정성                                         ║
    ╚════════════════════════════════════════════════════════════╝
    """)
    
    # 설정 입력
    print("📂 다운로드 기본 경로 설정")
    base_path = input("   다운로드 경로 입력 (Enter = 기본값): ").strip()
    
    if not base_path:
        base_path = "C:/내부페이지/홈택스_종합소득세"
    
    # 오늘 날짜 폴더
    today = datetime.now().strftime("%Y%m%d")
    download_folder = Path(base_path) / today
    
    print("\n👤 주민등록번호 입력")
    resident_number = input("   주민등록번호 (123456-1234567): ").strip()
    
    if not resident_number or '-' not in resident_number:
        print("❌ 주민등록번호 형식이 올바르지 않습니다.")
        input("Enter 키를 눌러 종료...")
        return
    
    print(f"\n✅ 다운로드 폴더: {download_folder}")
    
    # 자동화 실행
    automation = HometaxHybridAutomation(download_folder, resident_number)
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
