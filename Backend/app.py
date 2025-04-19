from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import torch
from transformers import AutoTokenizer, AutoModelForQuestionAnswering, pipeline
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import random

app = Flask(__name__)
CORS(app)

# Load model và dữ liệu
model_path = "/Users/trananhtuan/Documents/datsan247/Badminton_Manager/AI/badminton_qa_model"
tokenizer = AutoTokenizer.from_pretrained(model_path)
model = AutoModelForQuestionAnswering.from_pretrained(model_path)
embedding_model = SentenceTransformer('distilbert-base-nli-mean-tokens')

df = pd.read_csv("/Users/trananhtuan/Documents/datsan247/Badminton_Manager/AI/data/Question.csv")

topic_dict = {
    "booking": ["book", "reservation", "schedule", "available", "court", "time", "slot", "booking", "reschedule", "tournament", "organize", "session", "reserve", "advance", "statistics", "history", "past"],
    "account": ["personal", "information", "login", "password", "register", "account", "profile", "signin", "signup", "forgot", "email", "facebook", "instagram", "twitter", "tiktok", "zalo", "microsoft", "phone", "reset", "create", "sign up", "format"],
    "equipment": ["racket", "rent", "shuttlecock", "equipment", "purchase", "buy", "drinks", "water"],
    "facilities": ["changing room", "locker", "parking", "facility", "toilet", "shower", "indoor", "outdoor", "location", "address"],
    "payment": ["pay", "payment", "fee", "cost", "price", "refund", "cancel", "money","charged", "free", "rate", "hourly", "vnd"],
    "contact": ["contact", "staff", "help", "support", "question", "assistance", "email", "call", "hotline", "phone", "message", "reply", "respond", "inquiry", "email", "hotline"],
    "website": ["news", "updates", "promotions", "discounts", "services", "policy", "terms", "guidelines", "introduction", "homepage", "section", "button"],
    "misc": []  # Mặc định cho câu hỏi không thuộc chủ đề nào
}

# Xác định chủ đề cho câu hỏi
def identify_topic(question):
    question = question.lower()
    
    # Kiểm tra từng chủ đề
    for topic, keywords in topic_dict.items():
        for keyword in keywords:
            if keyword in question:
                return topic
    
    return "misc"  # Chủ đề mặc định

# Tạo context theo chủ đề
def create_topic_contexts(df):
    topic_contexts = {}
    
    # Khởi tạo context cho mỗi chủ đề
    for topic in topic_dict.keys():
        topic_contexts[topic] = ""
    
    # Phân loại câu hỏi vào các chủ đề
    for _, row in df.iterrows():
        question = row['Question']
        answer = row['Answer']
        
        # Xác định chủ đề
        topic = identify_topic(question)
        
        # Thêm vào context của chủ đề tương ứng
        topic_contexts[topic] += f"Question: {question}\nAnswer: {answer}\n\n"
    
    return topic_contexts

# Tạo embeddings cho tất cả câu hỏi
def create_question_embeddings(df):
    questions = df['Question'].tolist()
    embeddings = embedding_model.encode(questions)
    return embeddings

# Tìm câu hỏi tương tự nhất
def find_similar_questions(question, df, embeddings, top_k=3):
    # Tạo embedding cho câu hỏi
    question_embedding = embedding_model.encode([question])[0]
    
    # Tính độ tương đồng
    similarities = cosine_similarity([question_embedding], embeddings)[0]
    
    # Lấy top_k câu hỏi có độ tương đồng cao nhất
    top_indices = np.argsort(similarities)[-top_k:][::-1]
    
    # Tạo context từ top_k câu hỏi
    context = ""
    for idx in top_indices:
        q = df.iloc[idx]['Question']
        a = df.iloc[idx]['Answer']
        context += f"Question: {q}\nAnswer: {a}\n\n"
    
    return context, similarities[top_indices[0]]

# Khởi tạo contexts và embeddings
topic_contexts = create_topic_contexts(df)
embeddings = create_question_embeddings(df)

# Sử dụng
def smart_qa_system(question, df, model, tokenizer):
    # Xác định chủ đề
    topic = identify_topic(question)

    if topic == "misc":
        default_responses = [
            "I don't understand your question.", 
            "Please ask again."
        ]
        random_response = random.choice(default_responses)
        return random_response, 1.0, "default_response"

    similar_questions_df = df[df['Question'].apply(lambda q: identify_topic(q) == topic)]
    if len(similar_questions_df) > 0:
        similar_embeddings = create_question_embeddings(similar_questions_df)
        context, similarity = find_similar_questions(question, similar_questions_df, similar_embeddings)
        
        # Nếu độ tương đồng cao, trả về câu trả lời trực tiếp
        if similarity > 0.85:
            for idx in np.argsort(cosine_similarity([embedding_model.encode([question])[0]], similar_embeddings)[0])[-1:]:
                return similar_questions_df.iloc[idx]['Answer'], similarity, "direct_match"
            
    context = topic_contexts[topic]
    
    # Sử dụng pipeline question-answering
    nlp = pipeline("question-answering", model=model, tokenizer=tokenizer)
    result = nlp(question=question, context=context)
    
    return result['answer'], result['score'], "model_answer"

@app.route('/api/chat', methods=['POST'])
def chat():
    print("📥 Đã nhận request tới /api/chat")
    
    data = request.json
    user_message = data.get('message', '')

    if not user_message:
        return jsonify({"answer": "Bạn chưa nhập câu hỏi.", "score": 0, "method": "error"})
    
    if not user_message:
        return jsonify({'error': 'No message provided'}), 400
    
    answer, score, method = smart_qa_system(user_message, df, model, tokenizer)
    
    return jsonify({
        'answer': answer,
        'score': float(score),
        'method': method
    })

if __name__ == "__main__":
    app.run(debug=True, port=5001)