Use this plugin: https://github.com/zhaoterryy/mkdocs-pdf-export-plugin. Refer to this link for installation.

When you use Conda package management, if you encounter "OSError: cannot load library 'gobject-2.0-0'" when installing WeasyPrint, use the Conda package [here](https://anaconda.org/conda-forge/weasyprint). 

Run: `ENABLE_PDF_EXPORT=1 mkdocs build`