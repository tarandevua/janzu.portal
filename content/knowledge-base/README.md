# Knowledge base authoring

Store trusted portal documentation in the matching locale directory:

```text
content/knowledge-base/
├── en/<section>/<article>.mdx
└── es/<section>/<article>.mdx
```

Use the same relative path for translations so changing the portal language keeps
the reader on the corresponding topic.

Every article requires validated frontmatter:

```yaml
---
title: Article title
description: One-sentence summary used in page metadata.
section: Section label
sectionOrder: 10
order: 10
roles:
  - practitioner
status: published
---
```

- `sectionOrder` orders sections and `order` orders articles within a section.
- Omit `roles` to make an article visible to every authenticated portal user.
- Allowed roles are `admin`, `manager`, `facilitator`, `practitioner`, and `apprentice`.
- Use `status: draft` to keep unfinished content out of navigation and generated routes.
- Level-two and level-three headings generate the article outline automatically.
- MDX can execute imported components, so only accept changes from trusted repository contributors.

Metadata, paths, and duplicate slugs are validated by the server content index
before articles are rendered.
