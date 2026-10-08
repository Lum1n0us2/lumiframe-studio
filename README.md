# LumiFrame Studio
## 사용 방법
`index.html`을 브라우저로 열면 바로 사용할 수 있습니다. 별도 빌드나 서버는 필요하지 않습니다. 정적 웹 호스팅에도 그대로 올릴 수 있습니다.

모든 이미지와 음악 처리는 브라우저 안에서 이루어집니다. 기본 이미지는 캔버스로 그린 빈 자리 표시입니다. 음악 메타데이터가 없는 항목은 기존 값을 유지합니다. 음악 재생 지원은 브라우저와 파일 형식에 따라 달라지며, GIF에는 소리가 포함되지 않습니다. 프로젝트에는 음악 정보와 커버가 저장되지만 음악 파일 자체는 포함되지 않으므로 다시 선택해야 합니다.

Google Fonts를 불러오며 오프라인에서는 시스템 글꼴을 사용합니다.

## 파일
- `index.html`, `style.css`: 편집기 화면
- `app.js`: 캔버스 렌더링, 편집 상태, GIF 인코딩
- `audio-metadata.js`: 음악 메타데이터와 재생시간 처리
- `vendor/jsmediatags.min.js`: 로컬 메타데이터 리더

## 확인
Node.js로 다음 검사를 실행할 수 있습니다.

```sh
node --check app.js
node check-timing.cjs
node check-audio.cjs
```

## 타사 라이브러리
[jsmediatags 3.9.7](https://github.com/aadsm/jsmediatags): BSD-3-Clause. 라이선스는 `vendor/jsmediatags.LICENSE.md`에 포함되어 있습니다.
개발 참고용 GIF, 추출한 이미지, 테스트 출력 파일은 소스 배포에 포함하지 않습니다.
