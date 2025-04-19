# test_qa.py
from app import smart_qa_system, df, model, tokenizer

question = "How do I book a badminton court?"
answer, score, method = smart_qa_system(question, df, model, tokenizer)
print(f"Answer: {answer}")
print(f"Score: {score}")
print(f"Method: {method}")