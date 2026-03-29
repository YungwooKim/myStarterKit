# StarterKit 프로젝트 규칙

@./RULES.md

## 제외 항목

rules.txt의 "2. 디렉토리 구조" 섹션은 참고용이며, 구조는 언제든지 변경될 수 있으므로 강제 적용하지 않음.

## 개발 명령어

- 개발 서버: `npm run dev`
- 빌드: `npm run build`
- 시드 실행: `npx tsx prisma/seed.ts`
- 마이그레이션: `npx prisma migrate dev --name [설명]`
- DB 스키마 반영(개발): `npx prisma db push`
