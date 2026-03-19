-- 영양소 RDI/UL 기준 데이터 (ingredients 테이블과 독립, API 재수집 시에도 보존)
CREATE TABLE IF NOT EXISTS nutrient_rdi (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT UNIQUE NOT NULL,           -- 성분명 (ingredients.canonical_name과 매칭)
  category    TEXT NOT NULL DEFAULT '기타',
  daily_rdi   NUMERIC,                         -- 1일 권장섭취량
  daily_ul    NUMERIC,                         -- 상한섭취량
  rdi_unit    TEXT,                             -- 단위 (mg, μg 등)
  description TEXT,                             -- 효과 설명
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE nutrient_rdi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nutrient_rdi_read" ON nutrient_rdi FOR SELECT USING (true);

-- 한국인 영양소 섭취기준 (2020) 기반 시드 데이터
INSERT INTO nutrient_rdi (name, category, daily_rdi, daily_ul, rdi_unit, description) VALUES
  -- 비타민
  ('비타민A', '비타민', 700, 3000, 'μg RAE', '정상적인 시각 적응, 피부와 점막 건강 유지'),
  ('비타민B1', '비타민', 1.2, NULL, 'mg', '탄수화물과 에너지 대사에 필요'),
  ('비타민B2', '비타민', 1.5, NULL, 'mg', '체내 에너지 생성에 필요'),
  ('비타민B6', '비타민', 1.5, 100, 'mg', '단백질 및 아미노산 이용에 필요'),
  ('비타민B12', '비타민', 2.4, NULL, 'μg', '정상적인 엽산 대사에 필요'),
  ('비타민C', '비타민', 100, 2000, 'mg', '결합조직 형성, 철의 흡수, 항산화 작용'),
  ('비타민D', '비타민', 10, 100, 'μg', '칼슘과 인의 흡수, 뼈의 형성과 유지에 필요'),
  ('비타민E', '비타민', 12, 540, 'mg', '항산화 작용을 하여 유해산소로부터 세포를 보호'),
  ('비타민K', '비타민', 70, NULL, 'μg', '정상적인 혈액응고에 필요, 뼈의 구성에 필요'),
  ('나이아신', '비타민', 16, 35, 'mg NE', '체내 에너지 생성에 필요'),
  ('판토텐산', '비타민', 5, NULL, 'mg', '지방, 탄수화물, 단백질 대사와 에너지 생성에 필요'),
  ('엽산', '비타민', 400, 1000, 'μg DFE', '세포와 혈액생성에 필요, 태아 신경관의 정상 발달에 필요'),
  ('비오틴', '비타민', 30, NULL, 'μg', '지방, 탄수화물, 단백질 대사와 에너지 생성에 필요'),
  -- 미네랄
  ('칼슘', '미네랄', 800, 2500, 'mg', '뼈와 치아 형성에 필요, 신경과 근육 기능 유지에 필요'),
  ('철', '미네랄', 12, 45, 'mg', '체내 산소운반과 혈액생성에 필요'),
  ('아연', '미네랄', 10, 35, 'mg', '정상적인 면역기능에 필요, 정상적인 세포분열에 필요'),
  ('구리', '미네랄', 0.8, 10, 'mg', '철의 운반과 이용에 필요'),
  ('셀렌', '미네랄', 55, 400, 'μg', '유해산소로부터 세포를 보호하는데 필요'),
  ('마그네슘', '미네랄', 340, 350, 'mg', '에너지 이용에 필요, 신경과 근육 기능 유지에 필요'),
  ('요오드', '미네랄', 150, 2400, 'μg', '갑상선 호르몬의 합성에 필요'),
  ('망간', '미네랄', 4, 11, 'mg', '뼈 형성에 필요, 에너지 이용에 필요'),
  ('몰리브덴', '미네랄', 25, 600, 'μg', '산화·환원 효소의 활성에 필요'),
  ('크롬', '미네랄', 30, NULL, 'μg', '체내 탄수화물, 지방, 단백질 대사에 필요'),
  ('칼륨', '미네랄', 3500, NULL, 'mg', '체액과 산-염기 균형 유지'),
  ('인', '미네랄', 700, 3500, 'mg', '뼈와 치아 형성에 필요, 에너지 대사에 필요')
ON CONFLICT (name) DO UPDATE SET
  daily_rdi = EXCLUDED.daily_rdi,
  daily_ul = EXCLUDED.daily_ul,
  rdi_unit = EXCLUDED.rdi_unit,
  description = EXCLUDED.description,
  updated_at = now();
