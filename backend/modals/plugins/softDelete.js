/**
 * Soft-delete: sets `deleted_at` instead of removing documents.
 * Default queries exclude deleted rows; use `.setOptions({ includeDeleted: true })` to bypass.
 */
export function softDeletePlugin(schema) {
  schema.add({
    deleted_at: { type: Date, default: null, index: true },
  });

  function excludeDeleted() {
    const options = this.getOptions();
    if (options.includeDeleted === true) {
      return;
    }
    this.where({ deleted_at: null });
  }

  schema.pre(
    [
      "find",
      "findOne",
      "findOneAndUpdate",
      "countDocuments",
      "estimatedDocumentCount",
      "distinct",
    ],
    excludeDeleted,
  );

  schema.methods.softDelete = async function softDelete() {
    this.deleted_at = new Date();
    await this.save();
  };

  /**
   * @param {Record<string, unknown>} conditions
   */
  schema.statics.softDeleteMany = function softDeleteMany(conditions = {}) {
    return this.updateMany(
      { $and: [conditions, { deleted_at: null }] },
      { $set: { deleted_at: new Date() } },
    );
  };
}
