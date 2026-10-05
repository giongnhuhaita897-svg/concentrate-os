import assert from 'node:assert/strict'
import { test } from 'node:test'
import { normalizeSearch } from './format.ts'

test('Vietnamese search ignores accents, case and surrounding whitespace', () => {
  assert.equal(normalizeSearch('  HỌC TẬP  '), 'hoc tap')
  assert.equal(normalizeSearch('Đọc sách mỗi ngày'), 'doc sach moi ngay')
  assert.equal(normalizeSearch('ĐƯỜNG ĐẾN MỤC TIÊU'), 'duong den muc tieu')
})

test('Vietnamese search accepts both composed and decomposed Unicode', () => {
  const title = 'Luyện kỹ năng đọc hiểu'
  assert.equal(normalizeSearch(title.normalize('NFC')), normalizeSearch(title.normalize('NFD')))
  assert.ok(normalizeSearch(title).includes(normalizeSearch('ky nang doc')))
  assert.ok(normalizeSearch(title).includes(normalizeSearch('kỹ năng đọc')))
})

test('search preserves numbers and punctuation without changing stored titles', () => {
  const title = 'Chinh phục IELTS 7.0'
  assert.equal(normalizeSearch(title), 'chinh phuc ielts 7.0')
  assert.equal(title, 'Chinh phục IELTS 7.0')
  assert.ok(normalizeSearch(title).includes(normalizeSearch('IELTS 7.0')))
  assert.equal(normalizeSearch('   '), '')
  assert.ok(normalizeSearch(title).includes(normalizeSearch('')))
  assert.equal(normalizeSearch(title).includes(normalizeSearch('toán học')), false)
})
