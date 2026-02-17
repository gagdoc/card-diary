# 웹 배포 및 구글 로그인 설정 가이드 (Deployment Guide)

아이폰(iOS) 등 모바일 기기에서 이 앱을 사용하려면, 앱을 인터넷 상에 배포(Deployment)해야 합니다.
**Vercel**을 통한 무료 배포 방법과, 배포 후 **Google Cloud Console** 설정을 변경하는 방법을 안내합니다.

## 1. Vercel로 배포하기 (추천)

Vercel은 React 앱을 가장 쉽고 빠르게 무료로 배포할 수 있는 서비스입니다.

### 단계
1.  **GitHub에 코드 올리기**:
    -   현재 코드를 GitHub 저장소(Repository)에 업로드합니다.
2.  **Vercel 접속 및 로그인**:
    -   [vercel.com](https://vercel.com)에 접속하여 GitHub 계정으로 로그인합니다.
3.  **새 프로젝트 추가 (Add New Project)**:
    -   'Add New Project' 버튼을 누르고, 방금 코드를 올린 GitHub 저장소를 선택('Import')합니다.
4.  **배포 설정 (Deploy)**:
    -   'Framework Preset'이 'Vite'로 자동 설정되었는지 확인합니다.
    -   'Deploy' 버튼을 클릭합니다.
    -   잠시 후 배포가 완료되면 `https://your-project-name.vercel.app` 형태의 도메인(URL)이 생성됩니다.

---

## 2. Google Cloud Console 설정 변경 (필수)

앱의 도메인이 `localhost`에서 `https://your-project-name.vercel.app`으로 변경되었으므로, 구글 로그인 설정도 업데이트해야 합니다.

### 단계
1.  [Google Cloud Console](https://console.cloud.google.com/)에 접속하여 프로젝트를 선택합니다.
2.  좌측 메뉴에서 **API 및 서비스 > 사용자 인증 정보 (Credentials)**로 이동합니다.
3.  **OAuth 2.0 클라이언트 ID** 목록에서 설정했던 항목(예: 'Web Client 1')을 클릭합니다.
4.  **승인된 자바스크립트 원본 (Authorized JavaScript origins)**:
    -   기존 `http://localhost:5173`은 유지(개발용)하고,
    -   **URI 추가**를 눌러 배포된 Vercel 도메인(`https://your-project-name.vercel.app`)을 입력합니다. **(마지막에 '/'가 없어야 합니다)**
5.  **승인된 리디렉션 URI (Authorized redirect URIs)**:
    -   마찬가지로 배포된 도메인을 추가합니다. (이 앱은 팝업 방식을 쓰므로 원본 도메인과 동일하게 입력해도 됩니다)
    -   보통 `https://your-project-name.vercel.app` 만 추가하면 됩니다.
6.  **저장 (Save)**을 누릅니다.

---

## 3. 아이폰에서 사용하기

1.  아이폰 Safari 브라우저에서 배포된 URL로 접속합니다.
2.  구글 로그인을 진행합니다. (설정 변경 후 적용까지 최대 1시간 정도 걸릴 수 있습니다)
3.  브라우저 하단 '공유' 버튼 -> **'홈 화면에 추가'**를 누르면 앱처럼 아이콘이 생기고 전체 화면으로 사용할 수 있습니다.

## 4. 이미지 저장 변경 사항 확인

이제 사진을 업로드하면 구글 드라이브의 `CardDiaryImages` 폴더에 이미지 파일로 저장됩니다.
-   PC에서 업로드한 사진을 아이폰에서도 볼 수 있고, 그 반대도 가능합니다.
-   초기 로딩 속도가 훨씬 빨라집니다.
