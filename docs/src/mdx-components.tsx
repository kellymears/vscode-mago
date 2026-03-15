import type { MDXComponents } from "mdx/types";
import { Code } from "bright";
import { Terminal } from "@/components/terminal";

Code.theme = {
  dark: "dracula",
  light: "github-light",
  lightSelector: "html:not(.dark)",
};

const shellLanguages = new Set(["sh", "bash", "shell", "zsh"]);

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    pre: (props: React.ComponentProps<"pre">) => {
      const child = props.children as React.ReactElement<{
        className?: string;
        children?: string;
      }>;
      const lang = child?.props?.className?.replace("language-", "") ?? "";

      if (shellLanguages.has(lang) && typeof child.props.children === "string") {
        return <Terminal>{child.props.children}</Terminal>;
      }

      return <Code {...(props as any)} />;
    },
  };
}
