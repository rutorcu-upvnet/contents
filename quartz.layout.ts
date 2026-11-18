import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"
import { QuartzComponent } from "./quartz/components/types"
// @ts-ignore
import stepNavigationScript from "./quartz/components/scripts/step-navigation-init.inline"
// @ts-ignore
import littleEndianConverterScript from "./quartz/components/scripts/little-endian-converter.inline"

const StepNavigation: QuartzComponent = () => null
StepNavigation.afterDOMLoaded = stepNavigationScript

const LittleEndianConverter: QuartzComponent = () => null
LittleEndianConverter.afterDOMLoaded = littleEndianConverterScript

const CourseExplorer = Component.Explorer({
  folderClickBehavior: "link",
  mapFn: (node) => {
    if (node.slug === "index") {
      const sdp = node.children.find((child) => child.slugSegment === "sdp")
      if (sdp) {
        node.children = [
          ...node.children.filter((child) => child !== sdp),
          ...sdp.children.filter(
            (child) => child.slugSegment === "es" || child.slugSegment === "en",
          ),
        ]
      }
    }
  },
})

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [StepNavigation, LittleEndianConverter],
  footer: Component.Footer({
    links: {
      GitHub: "https://github.com/jackyzha0/quartz",
      "Discord Community": "https://discord.gg/cRFFHYye7t",
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
        { Component: Component.ReaderMode() },
      ],
    }),
    CourseExplorer,
  ],
  right: [
    Component.Graph(),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    }),
    CourseExplorer,
  ],
  right: [],
}
