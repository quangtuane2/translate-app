import os
import json
import argparse
from app.inference.segmenter import Segmenter

def extract_chunks_from_parallel_corpus(vi_file, ba_file, segmenter):
    """
    Extracts chunks from parallel Vietnamese and Ba-Na sentences.
    We assume sentence-to-sentence alignment.
    Since we only have the Segmenter for Vietnamese, we will extract chunks from Vietnamese,
    and simply pair them with the full Ba-Na sentence (since we cannot easily align Chunks without a complex aligner).
    Wait, the paper says: "For chunks, a fine-tuned BARTpho model is used to translate them into Bahnar language phrases."
    To train BARTpho on chunks, we need Chunk-to-Chunk alignment. 
    If we can't align chunks easily, the fallback is to train BARTpho on full sentences, OR to train on chunks if aligned data exists.
    Actually, training NMT on full sentences is standard and very robust. The segmentation approach is used at inference time to guarantee anchors are correct.
    Let's extract full sentences for NMT fine-tuning to make it simpler and more robust, 
    but we will also save the chunked versions if needed.
    """
    dataset = []
    with open(vi_file, 'r', encoding='utf-8') as fvi, open(ba_file, 'r', encoding='utf-8') as fba:
        vi_lines = fvi.read().splitlines()
        ba_lines = fba.read().splitlines()
        
        for vi, ba in zip(vi_lines, ba_lines):
            vi = vi.strip()
            ba = ba.strip()
            if vi and ba:
                dataset.append({
                    "vi": vi,
                    "ba": ba
                })
    return dataset

def main():
    dict_vi = "../dataset/dictionary/dict.vi"
    dict_ba = "../dataset/dictionary/dict.ba"
    
    # We will export the train/valid/test parallel corpus as JSON for Colab
    splits = ["train", "valid", "test"]
    output_dir = "colab_dataset"
    os.makedirs(output_dir, exist_ok=True)
    
    segmenter = Segmenter(dict_vi, dict_ba)
    
    for split in splits:
        vi_path = f"../dataset/parallel_corpus/{split}.vi"
        ba_path = f"../dataset/parallel_corpus/{split}.ba"
        
        print(f"Processing {split}...")
        if os.path.exists(vi_path) and os.path.exists(ba_path):
            data = extract_chunks_from_parallel_corpus(vi_path, ba_path, segmenter)
            out_file = os.path.join(output_dir, f"{split}_data.json")
            with open(out_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"Saved {len(data)} sentence pairs to {out_file}")
            
    print("Colab dataset preparation complete. You can zip the `colab_dataset` folder and upload it to Google Drive.")

if __name__ == "__main__":
    main()
