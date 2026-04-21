import fitz
import re
import json

def parse_pdf(file_path, output_json):
    doc = fitz.open(file_path)
    
    questions = []
    
    current_q = None
    current_choice = None
    
    q_pattern = re.compile(r'^(\d+)\s+-\s+(.*)')
    # more flexible choice pattern: e.g. [a]-- text or [ a]-- text or [A] - text
    c_pattern = re.compile(r'^\[\s*([a-zA-Z])\s*\][\s\-]+(.*)')
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        dict_data = page.get_text("dict")
        
        for block in dict_data.get("blocks", []):
            if "lines" in block:
                for line in block["lines"]:
                    line_text = ""
                    has_red = False
                    
                    for span in line["spans"]:
                        text = span["text"].strip()
                        color = span["color"]
                        
                        if text:
                            # if line_text already has content, occasionally we might need a space. 
                            # But span text inside a line often needs space if they were visually separated.
                            # Just appending with space is safer for reading.
                            line_text += (" " if line_text else "") + text
                            # Color 16711680 is 0xFF0000. Sometimes it's not exactly that but > 0.
                            # We'll check if color > 0, as normal text is 0. 
                            # But let's be safe and check if it's the specific red, or just > 0 since red is colored.
                            if color != 0: 
                                has_red = True
                    
                    line_text = line_text.strip()
                    if not line_text:
                        continue
                        
                    q_match = q_pattern.match(line_text)
                    if q_match:
                        if current_q:
                            questions.append(current_q)
                        
                        q_id = int(q_match.group(1))
                        q_text = q_match.group(2)
                        
                        current_q = {
                            "id": q_id,
                            "question": q_text,
                            "choices": [],
                            "correct_answer": -1
                        }
                        current_choice = None
                        continue
                        
                    c_match = c_pattern.match(line_text)
                    if c_match:
                        choice_letter = c_match.group(1).upper()
                        choice_text = c_match.group(2)
                        
                        if current_q:
                            current_q["choices"].append(f"{choice_letter}. {choice_text}".strip())
                            current_choice = len(current_q["choices"]) - 1
                            
                            if has_red:
                                current_q["correct_answer"] = current_choice
                                
                        continue
                        
                    if current_q and current_choice is not None:
                        current_q["choices"][current_choice] += " " + line_text
                        if has_red:
                            current_q["correct_answer"] = current_choice
                    elif current_q and current_choice is None:
                        current_q["question"] += " " + line_text
                        
    if current_q:
        questions.append(current_q)
        
    print(f"Total parsed questions: {len(questions)}")
    
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    parse_pdf("365 Câu TN _ có ĐA.pdf", "quiz_data.json")
