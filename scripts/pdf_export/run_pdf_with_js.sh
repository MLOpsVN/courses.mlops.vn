cd ../../

# 1st, mkdocs build with pdf-with-js configuration enable in mkdocs.yml
ENABLE_PDF_EXPORT=1 mkdocs build

# Move all pdfs to the scripts/pdf_export/pdfs
find site -name "*.pdf" -exec mv {} scripts/pdf_export/pdfs \;

cd scripts/pdf_export/pdfs

# Merge all pdfs into one single pdf file wrt the file name's order in chapters.txt
# Install: https://www.pdflabs.com/tools/pdftk-server/
# Install for M1 only: https://stackoverflow.com/a/60889993/6563277 to avoid the "pdftk: Bad CPU type in executable" on Mac
pdftk $(cat chapters.txt) cat output book.pdf

# Count pages https://stackoverflow.com/a/27132157/6563277
pageCount=$(pdftk book.pdf dump_data | grep "NumberOfPages" | cut -d":" -f2)

# Turn back to pdf_export
cd ..

# https://stackoverflow.com/a/30416992/6563277
# Create overlay pdf file contains only page numbers
gs -o pagenumbers.pdf    \
   -sDEVICE=pdfwrite        \
   -g5950x8420              \
   -c "/Helvetica findfont  \
       12 scalefont setfont \
       1 1  ${pageCount} {      \
       /PageNo exch def     \
       450 20 moveto        \
       (Page ) show         \
       PageNo 3 string cvs  \
       show                 \
       ( of ${pageCount}) show  \
       showpage             \
       } for"

# Blend pagenumbers.pdf with the original pdf file
pdftk pdfs/book.pdf              \
  multistamp pagenumbers.pdf \
  output final_book.pdf