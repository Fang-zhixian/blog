import remarkSmartypants from 'remark-smartypants';

function remarkTypography() {
  const transform = remarkSmartypants();
  return (tree, file) => {
    if (!file.data.astro?.frontmatter?.preserveText) transform(tree);
  };
}

/** @type {import('@astrojs/markdown-remark').AstroMarkdownOptions} */
export const markdownConfig = {
  smartypants: false,
  remarkPlugins: [remarkTypography],
  shikiConfig: {
    themes: { light: 'github-light', dark: 'github-dark' },
    defaultColor: false,
  },
  remarkRehype: {
    footnoteLabel: '参考文献',
    footnoteLabelProperties: { className: [] },
  },
};
