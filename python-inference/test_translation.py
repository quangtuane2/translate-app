import sys
if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')
from app.inference.translator import translate

test_vi = "Sáng ngày 23.7, Trung tâm giáo dục thường xuyên huyện Vĩnh Thạnh tổ chức Khai giảng lớp đào tạo nghề Trồng và nhân giống nấm"
print("Input:", test_vi)
res = translate(test_vi, source_lang="vi", target_lang="bna")
print("Output:", res)
