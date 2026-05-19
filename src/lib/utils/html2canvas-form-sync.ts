/**
 * html2canvas `<input>` value 렌더링 함정 해결 (PR #111).
 *
 * 문제:
 *   - `<input>`의 value는 attribute가 아니라 DOM property
 *   - 사용자가 폼을 채우면 inputElement.value는 변경되지만 HTML attribute는 그대로
 *   - html2canvas는 cloned DOM의 attribute만 보고 렌더링 → input이 빈 칸 + placeholder만
 *
 * 사용:
 *   await html2canvas(element, {
 *     onclone: syncFormValuesForCapture,
 *   })
 *
 * 처리:
 *   - input: value → setAttribute('value', ...)
 *   - textarea: value → textContent
 *   - select: selectedOption에 selected attribute 부여
 *   - checked input: setAttribute('checked', '') / removeAttribute
 */

export function syncFormValuesForCapture(clonedDoc: Document): void {
  clonedDoc.querySelectorAll('input').forEach((input) => {
    if (input.type === 'checkbox' || input.type === 'radio') {
      if (input.checked) input.setAttribute('checked', '')
      else input.removeAttribute('checked')
      return
    }
    input.setAttribute('value', input.value)
  })

  clonedDoc.querySelectorAll('textarea').forEach((textarea) => {
    textarea.textContent = textarea.value
  })

  clonedDoc.querySelectorAll('select').forEach((select) => {
    Array.from(select.options).forEach((opt) => opt.removeAttribute('selected'))
    const selected = select.options[select.selectedIndex]
    if (selected) selected.setAttribute('selected', 'selected')
  })
}
