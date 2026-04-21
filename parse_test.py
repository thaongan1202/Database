import fitz

def test_parse():
    doc = fitz.open("365 Câu TN _ có ĐA.pdf")
    for page_num in range(2): # just first 2 pages
        page = doc[page_num]
        dict_data = page.get_text("dict")
        for block in dict_data.get("blocks", []):
            if "lines" in block:
                for line in block["lines"]:
                    for span in line["spans"]:
                        text = span["text"].strip()
                        color = span["color"]
                        if text:
                            if color != 0: # 0 is usually black
                                print(f"RED/COLORED TEXT: {text} | Color: {color}")
                            else:
                                print(f"Text: {text} | Color: {color}")

if __name__ == "__main__":
    test_parse()
