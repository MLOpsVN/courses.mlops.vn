Mermaid is a JavaScript-based diagramming and charting tool that uses Markdown-inspired text definitions and a renderer to create and modify complex diagrams. 
The main purpose of Mermaid is to help documentation catch up with development (cited from [here](https://github.com/mermaid-js/mermaid)).

In this project, we're using `mkdocs-material` with mermaid extension, configured as follows (in `mkdocs.yml`):

```yaml
...
markdown_extensions:
- pymdownx.superfences:
    custom_fences:
      - name: mermaid
        class: mermaid
...
```

Everything seems normal in the browser when executing `mkdocs serve`. 
However, we encounter many troubles with PDF exporting.

### WeasyPrint approach

We have tried several plugins. Most of them depend on Weasy Print. 
We choose [mkdocs-with-pdf](https://pypi.org/project/mkdocs-with-pdf/) 
because of its functionalities with lots of custom configurations. 
But all plugins (related to WeasyPrint approach) have problems with mermaid diagrams (didn't render and are still in code block's style, even though we use the JS rendering option), 
as [this open issue](https://github.com/orzih/mkdocs-with-pdf/issues/93). 
A workaround when using this package is to save all rendered mermaid diagrams as images and use `<image>` instead of `mermaid` markdown.
At the time we do experiments, we still have another [issue here](https://github.com/orzih/mkdocs-with-pdf/issues/79) 
(a workaround is installing `beautifulsoup4==4.9.3` first), and [alignment issue](https://github.com/orzih/mkdocs-with-pdf/issues/135) in MacOS M1.

Install `mkdocs-with-pdf==0.9.3` and configure in `mkdocs.yml`:
```markdown
  - with-pdf:
      author: Quan Dang & Tung Dao
      copyright: MLopsVN
      cover: yes
      back_cover: true
      cover_title: MLOPS CRASH COURSE
      cover_subtitle: An elegant way to do AI projects at a reasonable scale 
      custom_template_path: TEMPLATES PATH
      toc_title: Table of Contents
      heading_shift: true
      toc_level: 3
      ordered_chapter_level: 2
      output_path: pdfs/book.pdf
      show_anchors: true
      render_js: true
      headless_chrome_path: "/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome"
      enabled_if_env: ENABLE_PDF_EXPORT
      debug_html: true
      verbose: false
```

Run: `ENABLE_PDF_EXPORT=1 mkdocs build`.

If you encounter a problem with the admonition icon's display, install `mkdocs-extra-sass-plugin` and configure it as [this comment](https://github.com/orzih/mkdocs-with-pdf/issues/89#issuecomment-1219528660).

### Browser approach
Another easy-and-simple approach is print pages which use browser. There is a plugin ([mkdocs-pdf-with-js-plugin](https://github.com/sandrointrtl/mkdocs-pdf-with-js-plugin)) that has done a good job. 
In our experiment, we use another fork version [here](https://github.com/vuquangtrong/mkdocs-pdf-with-js-plugin.git) for [better documentation](https://www.codeinsideout.com/blog/site-setup/print-to-pdf/) and other customization.
However, it doesn't contain the `combined` feature (combine all pages into a single PDF file) and other functionalities that we need as [mkdocs-with-pdf](https://pypi.org/project/mkdocs-with-pdf/) package.
We achieved this using many dependencies.

Install `mkdocs-pdf-with-js-plugin` and configure in `mkdocs.yml`:

```markdown
  - pdf-with-js:
      enable: true # should enable only when need PDF files
      add_download_button: false
      display_header_footer: true
      header_template: >-
        <div style="font-size:8px; margin:auto; color:lightgray;">
            <span class="title">MLOpsVN</span>
        </div>
      footer_template: >-
        <div style="font-size:8px; margin:auto; color:lightgray;">
        </div>

```

Run: `ENABLE_PDF_EXPORT=1 mkdocs build`. Each markdown file will be exported to a PDF file.

Then, we will define the order of all PDFs when merging into one unique file by putting the PDF name from top to bottom:

In `chapters.txt`:

```text
Home.pdf
MLOps_Crash_Course.pdf
Tổng_quan_MLOps.pdf
Phân_tích_vấn_đề.pdf
MLOps_platform.pdf
POC.pdf
Tổng_quan_pipeline.pdf
Airflow_cơ_bản.pdf
Feature_store.pdf
Xây_dựng_pipeline.pdf
Training_pipeline.pdf
Model_serving.pdf
Tổng_quan_monitoring.pdf
Metrics_hệ_thống.pdf
Thiết_kế_monitoring_service.pdf
Triển_khai_monitoring_service.pdf
Giới_thiệu.pdf
Kiểm_thử_hệ_thống.pdf
Jenkins_cơ_bản.pdf
CI_CD_cho_data_pipeline.pdf
CI_CD_cho_model_serving.pdf
Tổng_kết.pdf
Contributing.pdf
Code_of_Conduct.pdf
```

Then run the following script. Remember that this script is just a hint of what we have done, it has not been completed yet and has not run "as is".

```shell
# ================================================================================================
# Move all pdfs from "site" (the output dir of pdf exporting) to the scripts/pdf_export/pdfs
# ================================================================================================
find site -name "*.pdf" -exec mv {} scripts/pdf_export/pdfs \;

cd scripts/pdf_export/pdfs

# ================================================================================================
# Merge all pdfs into one single pdf file wrt the file name's order in chapters.txt
# ================================================================================================
# REMEMBER to put the chapters.txt into scripts/pdf_export/pdfs.
# Install: https://www.pdflabs.com/tools/pdftk-server/
# Install for M1 only: https://stackoverflow.com/a/60889993/6563277 to avoid the "pdftk: Bad CPU type in executable" on Mac
pdftk $(cat chapters.txt) cat output book.pdf

# ================================================================================================
# Add page numbers
# ================================================================================================
# Count pages https://stackoverflow.com/a/27132157/6563277
pageCount=$(pdftk book.pdf dump_data | grep "NumberOfPages" | cut -d":" -f2)

# Turn back to scripts/pdf_export
cd ..

# https://stackoverflow.com/a/30416992/6563277
# Create an overlay pdf file containing only page numbers
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
```

However, we need other customization like table of contents, book cover, and author section, ... All the above steps are just merging and adding page nums! Lots of things to do.
