import React, { useState, useMemo } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { Book } from '../../types/library';
import { Search, Plus, Edit2, Trash2, Eye, BookOpen, Filter, CheckCircle2, AlertCircle, Barcode, X } from 'lucide-react';

interface BooksTabProps {
  initialOpenAdd?: boolean;
}

export const BooksTab: React.FC<BooksTabProps> = () => {
  const { books, addBook, updateBook, deleteBook } = useLibrary();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [availabilityFilter, setAvailabilityFilter] = useState<'All' | 'Available' | 'Fully Issued'>('All');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [viewingBook, setViewingBook] = useState<Book | null>(null);

  // Form input state
  const [formData, setFormData] = useState({
    isbn: '',
    title: '',
    author: '',
    category: 'Computer Science',
    publication_year: 2024,
    copies_total: 3,
    shelf_location: 'Stack A-01',
    cover_color: '#2563eb',
  });

  const categories = useMemo(() => {
    const set = new Set(books.map((b) => b.category));
    return ['All', ...Array.from(set).sort()];
  }, [books]);

  // Filtered books
  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q) ||
        b.shelf_location.toLowerCase().includes(q);

      const matchCategory = selectedCategory === 'All' || b.category === selectedCategory;

      let matchAvail = true;
      if (availabilityFilter === 'Available') matchAvail = b.copies_available > 0;
      if (availabilityFilter === 'Fully Issued') matchAvail = b.copies_available === 0;

      return matchSearch && matchCategory && matchAvail;
    });
  }, [books, searchQuery, selectedCategory, availabilityFilter]);

  const openAddModal = () => {
    setEditingBook(null);
    setFormData({
      isbn: `978-0${Math.floor(100000000 + Math.random() * 900000000)}`,
      title: '',
      author: '',
      category: 'Computer Science',
      publication_year: new Date().getFullYear(),
      copies_total: 3,
      shelf_location: 'Stack A-01',
      cover_color: '#2563eb',
    });
    setIsFormOpen(true);
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setFormData({
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      category: book.category,
      publication_year: book.publication_year,
      copies_total: book.copies_total,
      shelf_location: book.shelf_location,
      cover_color: book.cover_color,
    });
    setIsFormOpen(true);
  };

  const handleDelete = (book: Book) => {
    if (confirm(`Are you sure you want to delete '${book.title}' by ${book.author}?`)) {
      const res = deleteBook(book.id);
      if (!res.success) {
        alert(res.message);
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.author.trim() || !formData.isbn.trim()) {
      alert('Please fill in Title, Author, and ISBN.');
      return;
    }

    if (editingBook) {
      const res = updateBook(editingBook.id, formData);
      if (res.success) {
        setIsFormOpen(false);
      } else {
        alert(res.message);
      }
    } else {
      const res = addBook(formData);
      if (res.success) {
        setIsFormOpen(false);
      } else {
        alert(res.message);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Filter & Search Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Title, Author, ISBN, or Shelf..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Availability</option>
            <option value="Available">Available Stock</option>
            <option value="Fully Issued">Fully Checked Out</option>
          </select>

          {/* Add Book Button */}
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Book</span>
          </button>
        </div>
      </div>

      {/* 2. Catalog Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4 w-12 text-center">ID</th>
                <th className="py-3 px-3">Book Title & Author</th>
                <th className="py-3 px-3">ISBN</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-center">Year</th>
                <th className="py-3 px-3 text-center">Stock</th>
                <th className="py-3 px-3 text-center">Available</th>
                <th className="py-3 px-3">Shelf</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredBooks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    {books.length === 0
                      ? 'No books in catalog. Upload your dataset file or click "+ Add New Book" to begin.'
                      : 'No books matched the search or filter criteria.'}
                  </td>
                </tr>
              ) : (
                filteredBooks.map((book) => {
                  const isNone = book.copies_available === 0;
                  const isLow = book.copies_available === 1 && book.copies_total > 1;

                  return (
                    <tr
                      key={book.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isNone ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center font-mono text-slate-400">{book.id}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-3 h-8 rounded-sm shrink-0 shadow-sm"
                            style={{ backgroundColor: book.cover_color }}
                          />
                          <div>
                            <div className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer" onClick={() => setViewingBook(book)}>
                              {book.title}
                            </div>
                            <div className="text-[11px] text-slate-500">by {book.author}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{book.isbn}</td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {book.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-500">{book.publication_year}</td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">{book.copies_total}</td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            isNone
                              ? 'bg-rose-100 text-rose-700'
                              : isLow
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {book.copies_available} / {book.copies_total}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{book.shelf_location}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingBook(book)}
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors"
                            title="View Details & Barcode"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(book)}
                            className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
                            title="Edit Book"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(book)}
                            className="p-1.5 rounded hover:bg-rose-50 text-rose-600 transition-colors"
                            title="Delete Book"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Showing {filteredBooks.length} of {books.length} titles in catalog</span>
          <span>Tip: Double-click or click eye icon to view details and catalog barcode</span>
        </div>
      </div>

      {/* 3. Add / Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">
                  {editingBook ? 'Edit Book Details' : 'Register New Book to Catalog'}
                </h3>
                <p className="text-[11px] text-slate-400">Updates physical copy counts and shelving records</p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  ISBN Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="e.g. 978-0132350884"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Book Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Full title of the publication"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Author(s) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Author name"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Fiction">Fiction</option>
                    <option value="Literature">Literature</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Science">Science</option>
                    <option value="History">History</option>
                    <option value="Philosophy">Philosophy</option>
                    <option value="General Reference">General Reference</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    value={formData.publication_year}
                    onChange={(e) => setFormData({ ...formData, publication_year: parseInt(e.target.value) || 2024 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Total Copies *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.copies_total}
                    onChange={(e) => setFormData({ ...formData, copies_total: parseInt(e.target.value) || 1 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Shelf Location
                  </label>
                  <input
                    type="text"
                    value={formData.shelf_location}
                    onChange={(e) => setFormData({ ...formData, shelf_location: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="Stack A-01"
                  />
                </div>
              </div>

              {/* Cover color picker */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Book Cover Accent
                </label>
                <div className="flex items-center gap-3">
                  {[
                    { color: '#2563eb', label: 'Blue' },
                    { color: '#0284c7', label: 'Sky' },
                    { color: '#059669', label: 'Emerald' },
                    { color: '#d97706', label: 'Amber' },
                    { color: '#dc2626', label: 'Red' },
                    { color: '#7c3aed', label: 'Purple' },
                    { color: '#475569', label: 'Slate' },
                  ].map((c) => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setFormData({ ...formData, cover_color: c.color })}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                        formData.cover_color === c.color ? 'scale-125 ring-2 ring-slate-900 ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: c.color }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow transition-colors cursor-pointer"
                >
                  {editingBook ? 'Save Changes' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Book Details & Barcode Modal */}
      {viewingBook && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            {/* Header with visual book cover */}
            <div className="bg-slate-900 text-white p-6 relative">
              <button
                onClick={() => setViewingBook(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex gap-4 items-start">
                {/* Visual Cover */}
                <div
                  className="w-24 h-32 rounded-lg shrink-0 shadow-lg p-2.5 flex flex-col justify-between border border-white/20"
                  style={{ backgroundColor: viewingBook.cover_color }}
                >
                  <div className="text-[9px] font-bold uppercase tracking-wider text-white/90">
                    {viewingBook.category}
                  </div>
                  <div className="text-white font-extrabold text-[11px] leading-tight line-clamp-3">
                    {viewingBook.title}
                  </div>
                  <div className="text-[8px] text-white/80">{viewingBook.publication_year}</div>
                </div>

                <div>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-widest mb-1.5">
                    {viewingBook.category}
                  </span>
                  <h3 className="text-base font-extrabold text-white leading-tight">
                    {viewingBook.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">by {viewingBook.author}</p>

                  <div className="mt-3 inline-flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        viewingBook.copies_available > 0
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                      }`}
                    >
                      {viewingBook.copies_available > 0
                        ? `Available (${viewingBook.copies_available} of ${viewingBook.copies_total} in stock)`
                        : 'Currently Fully Checked Out'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Details Table */}
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">ISBN Code</div>
                  <div className="font-mono font-bold text-slate-800 text-sm mt-0.5">
                    {viewingBook.isbn}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Shelf Location</div>
                  <div className="font-mono font-bold text-slate-800 text-sm mt-0.5">
                    {viewingBook.shelf_location}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Publication Year</div>
                  <div className="font-bold text-slate-800 mt-0.5">{viewingBook.publication_year}</div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Date Added</div>
                  <div className="font-bold text-slate-800 mt-0.5">{viewingBook.added_date}</div>
                </div>
              </div>

              {/* Barcode Graphic */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Library Catalog Barcode Label
                </div>
                <div className="flex justify-center items-end gap-1 h-10 py-1">
                  {Array.from({ length: 42 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-slate-900 rounded-xs"
                      style={{
                        width: i % 3 === 0 ? '3px' : i % 5 === 0 ? '4px' : '1.5px',
                        height: i % 4 === 0 ? '90%' : '100%',
                      }}
                    />
                  ))}
                </div>
                <div className="font-mono text-xs font-bold text-slate-600 mt-1">
                  *{viewingBook.isbn.replace(/-/g, '')}*
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setViewingBook(null);
                    openEditModal(viewingBook);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Edit This Book
                </button>
                <button
                  onClick={() => setViewingBook(null)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
