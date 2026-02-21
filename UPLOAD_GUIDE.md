# GitHub 웹에서 파일 업로드 가이드

**날짜**: 2026-02-21 23:00  
**작업**: 테이블 오버플로우 수정 파일 업로드

---

## 📂 업로드할 파일 목록

GITHUB_UPLOAD 폴더 안에 5개 파일이 준비되어 있습니다:

1. ✅ `trader-detail.html` (수정됨)
2. ✅ `README.md` (수정됨)
3. ✅ `TABLE_OVERFLOW_FIX_2026-02-21.md` (신규)
4. ✅ `LOCAL_TEST_RESULT.md` (신규)
5. ✅ `DESIGN_FIX_2026-02-21.md` (신규)

---

## 🌐 GitHub 웹에서 업로드하는 방법

### 방법 1: 기존 파일 수정 (trader-detail.html, README.md)

#### trader-detail.html 수정

1. **GitHub 저장소 열기**
   ```
   https://github.com/atomtax/atomtax-app
   ```

2. **파일 찾기**
   - 파일 목록에서 `trader-detail.html` 클릭

3. **편집 모드**
   - 우측 상단 **연필 아이콘(✏️)** 클릭

4. **내용 교체**
   - `Ctrl + A` (전체 선택)
   - `GITHUB_UPLOAD/trader-detail.html` 파일 열기
   - 내용 전체 복사
   - GitHub 편집 창에 `Ctrl + V` (붙여넣기)

5. **커밋**
   - 하단 "Commit changes" 입력:
     ```
     Fix: 테이블 헤더 오버플로우 수정
     ```
   - **Commit changes** 버튼 클릭

#### README.md 수정

위와 같은 방법으로:
1. `README.md` 파일 클릭
2. 연필 아이콘(✏️) 클릭
3. `GITHUB_UPLOAD/README.md` 내용으로 교체
4. 커밋 메시지: `Docs: 테이블 수정 내역 추가`
5. **Commit changes** 클릭

---

### 방법 2: 새 파일 추가 (나머지 3개)

#### TABLE_OVERFLOW_FIX_2026-02-21.md 추가

1. **GitHub 저장소 메인 페이지**
   ```
   https://github.com/atomtax/atomtax-app
   ```

2. **Add file 클릭**
   - 우측 상단 **Add file** → **Create new file**

3. **파일 이름 입력**
   ```
   TABLE_OVERFLOW_FIX_2026-02-21.md
   ```

4. **내용 붙여넣기**
   - `GITHUB_UPLOAD/TABLE_OVERFLOW_FIX_2026-02-21.md` 열기
   - 내용 전체 복사
   - GitHub 편집 창에 붙여넣기

5. **커밋**
   - 하단 "Commit new file" 입력:
     ```
     Docs: 테이블 오버플로우 수정 상세 문서
     ```
   - **Commit new file** 클릭

#### LOCAL_TEST_RESULT.md 추가

1. **Add file** → **Create new file**
2. 파일 이름: `LOCAL_TEST_RESULT.md`
3. 내용 붙여넣기
4. 커밋 메시지: `Docs: 로컬 테스트 결과`
5. **Commit new file** 클릭

#### DESIGN_FIX_2026-02-21.md 추가

1. **Add file** → **Create new file**
2. 파일 이름: `DESIGN_FIX_2026-02-21.md`
3. 내용 붙여넣기
4. 커밋 메시지: `Docs: 디자인 수정 가이드`
5. **Commit new file** 클릭

---

## ⚡ 빠른 방법: 여러 파일 한 번에 업로드

### 드래그 앤 드롭 방식

1. **GitHub 저장소 메인 페이지**
   ```
   https://github.com/atomtax/atomtax-app
   ```

2. **Add file → Upload files**

3. **파일 드래그**
   - `GITHUB_UPLOAD` 폴더의 5개 파일을 전부 선택
   - GitHub 페이지로 드래그 앤 드롭

4. **커밋**
   - 커밋 메시지:
     ```
     Fix: 테이블 오버플로우 수정 및 문서 업데이트
     ```
   - **Commit changes** 클릭

---

## ✅ 업로드 후 확인

### 1. Netlify 자동 배포 확인
```
https://app.netlify.com/sites/atomtax-app/deploys
```
- "Building" → "Published" 전환 확인 (1~2분)

### 2. 실제 사이트 확인
```
https://atomtax-app.netlify.app/trader-detail.html
```
- **시크릿 모드**에서 열기 (Ctrl + Shift + N)
- 로그인 후 매매사업자 상세 페이지 확인
- 테이블 헤더 12개 정상 정렬 확인

### 3. 확인 사항
- [ ] 테이블 헤더가 한 줄로 정렬되는가?
- [ ] 빨간색 박스가 사라졌는가?
- [ ] 12개 칼럼이 모두 보이는가?
- [ ] 엑셀 업로드, 보고서 생성 작동하는가?

---

## 🚨 문제 발생 시

### 브라우저 캐시 문제
- **Ctrl + Shift + R** (하드 리프레시)
- **Ctrl + Shift + Delete** (캐시 삭제)
- **시크릿 모드** 사용

### Netlify 배포 실패
- Deploy log 확인
- 오류 메시지 복사 후 공유

---

## 📞 도움말

궁금한 점이 있으면:
1. 스크린샷 찍어서 공유
2. 에러 메시지 복사
3. 브라우저 콘솔 (F12) 확인

---

**모든 파일이 GITHUB_UPLOAD 폴더에 준비되어 있습니다!**  
**복사해서 GitHub에 붙여넣기만 하면 됩니다!** 🚀
