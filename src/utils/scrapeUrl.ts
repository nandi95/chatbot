import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';
import { isProbablyReaderable, Readability } from '@mozilla/readability';

export default async function scrapeUrl(url: string): Promise<string | null> {
    // throws error if url is not valid
    new URL(url);

    const htmlString = await fetch(url).then(async res => res.text());
    const document = new JSDOM(
        createDOMPurify(new JSDOM('').window).sanitize(htmlString),
        { url, pretendToBeVisual: true }
    );

    if (isProbablyReaderable(document.window.document)) {
        const article = new Readability(document.window.document).parse();
        return article?.textContent ?? null;
    }

    /**
     * Get the text content of an element, removing newlines and multiple spaces.
     */
    function getTextContent(element: Node): string {
        if (element.nodeType === 3) { // Node.TEXT_NODE
            return (element.textContent ?? '').replace(/[\n\r]+/g, ' ')
                .replace(/\s{2,}/g, ' ')
                .trim();
        } else if (element.nodeType === 1) { // Node.ELEMENT_NODE
            return Array.from(element.childNodes).reduce(
                (text, childElement) => text + getTextContent(childElement),
                ''
            );
        }

        return '';
    }

    return getTextContent(document.window.document.body.firstElementChild!.parentNode!);
}
