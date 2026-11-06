import { describe, expect, it } from "vitest";
import type { Elemento } from "@/lib/ediciones";
import { fotoDestacada, srcsetMedia, tamanosColumna, tamanosHoja, tamanosMiniatura } from "@/lib/imagen";

const foto = (over: object) => ({ tipo: "imagen", x: 0, y: 0, w: 800, h: 400, src: "/media/05/a.jpg", ...over }) as Elemento;

describe("tamaños adaptados de las fotos", () => {
  it("solo aplica a fotos propias", () => {
    expect(srcsetMedia("/media/05/a.jpg")).toContain("/_next/image?url=%2Fmedia%2F05%2Fa.jpg&w=640&q=75 640w");
    expect(srcsetMedia("/media/05/logo.svg")).toBeUndefined();
    expect(srcsetMedia("https://otro.sitio/a.jpg")).toBeUndefined();
    expect(srcsetMedia(undefined)).toBeUndefined();
  });

  it("codifica nombres con espacios o acentos", () => {
    expect(srcsetMedia("/media/05/Mi foto ñ.jpg")).toContain(encodeURIComponent("/media/05/Mi foto ñ.jpg"));
  });

  it("calcula el ancho según la parte de la hoja que ocupa", () => {
    expect(tamanosHoja({ w: 800, h: 400 })).toBe("(max-width: 900px) 100vw, 900px");
    expect(tamanosHoja({ w: 400, h: 200 })).toBe("(max-width: 900px) 50vw, 450px");
    expect(tamanosMiniatura({ w: 400, h: 200 })).toBe("(max-width: 639px) 31vw, 192px");
  });

  it("pide más resolución si la foto recortada o con zoom se dibuja más ancha que su caja", () => {
    expect(tamanosHoja({ w: 400, h: 400 })).toBe("(max-width: 900px) 75vw, 675px");
    expect(tamanosHoja({ w: 400, h: 200, zoom: 2 })).toBe("(max-width: 900px) 100vw, 900px");
    expect(tamanosHoja({ w: 400, h: 400, ajuste: "contener" })).toBe("(max-width: 900px) 50vw, 450px");
    expect(tamanosColumna({ w: 400, h: 800 }, 80)).toBe("100vw");
  });

  it("precarga la foto más grande de la parte de arriba", () => {
    const grande = foto({ id: "g", w: 700, h: 500 });
    const lista = [foto({ w: 100, h: 100 }), grande, foto({ y: 900, w: 800, h: 900 }), foto({ w: 800, h: 900, oculto: true }), foto({ w: 800, h: 900, src: "/media/a.svg" })];
    expect(fotoDestacada(lista)).toBe(grande);
    expect(fotoDestacada([])).toBeUndefined();
  });
});
