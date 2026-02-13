import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import SpritesRenderer from "./SpritesRenderer.vue";

describe("SpritesRenderer.vue", () => {
  it("renders the correct icon for a given name", () => {
    const name = "pikachu";
    const wrapper = mount(SpritesRenderer, {
      props: {
        generation: 9,
        name,
      },
    });
    expect(wrapper.html()).toContain("<img src");
  });

  it("does not render anything if no name is provided", () => {
    const wrapper = mount(SpritesRenderer, {
      props: {
        generation: 9,
        name: null,
      },
    });
    expect(wrapper.html()).not.toContain("<img src");
  });
});
