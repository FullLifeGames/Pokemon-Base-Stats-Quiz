import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import IconRenderer from "@/components/renderer/IconRenderer.vue";

describe("IconRenderer.vue", () => {
  it("renders the correct icon for a given name", () => {
    const name = "pikachu";
    const wrapper = mount(IconRenderer, {
      props: {
        name,
      },
    });
    expect(wrapper.html()).toContain("background: ");
  });

  it("does not render anything if no name is provided", () => {
    const wrapper = mount(IconRenderer, {
      props: {
        name: null,
      },
    });
    expect(wrapper.html()).not.toContain("background: ");
  });
});
