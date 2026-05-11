import { getDatabase } from "../db/index.ts";
import type { ClassProfile } from "../type/index.ts";

type ClassRow = {
  id: number;
  class_name: string;
  subject: string;
  current_unit: string | null;
  teacher_focus: string | null;
  test_format: string | null;
  test_examples: string;
  key_concepts: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function mapClassRow(row: ClassRow): ClassProfile {
  return {
    id: row.id,
    className: row.class_name,
    subject: row.subject,
    currentUnit: row.current_unit,
    teacherFocus: row.teacher_focus,
    testFormat: row.test_format,
    testExamples: row.test_examples
      ? (JSON.parse(row.test_examples) as string[])
      : [],
    keyConcepts: JSON.parse(row.key_concepts) as string[],
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getClassProfileById(id: number): ClassProfile | null {
  const db = getDatabase();
  const row = db.prepare(
    `
      SELECT
        id,
        class_name,
        subject,
        current_unit,
        teacher_focus,
        test_format,
        test_examples,
        key_concepts,
        notes,
        created_at,
        updated_at
      FROM classes
      WHERE id = ?
    `,
  ).get(id) as ClassRow | undefined;

  if (!row) {
    return null;
  }

  return mapClassRow(row);
}

export function saveClassProfile(
  input: ClassProfile,
  options: {
    ownerUserId?: string | null;
  } = {},
): ClassProfile {
  const db = getDatabase();
  // Arrays are stored as JSON text for now to keep the schema simple.
  const serializedTestExamples = JSON.stringify(input.testExamples);
  const serializedKeyConcepts = JSON.stringify(input.keyConcepts);

  if (input.id) {
    db.prepare(
      `
        UPDATE classes
        SET
          class_name = @className,
          subject = @subject,
          current_unit = @currentUnit,
          teacher_focus = @teacherFocus,
          test_format = @testFormat,
          test_examples = @testExamples,
          key_concepts = @keyConcepts,
          notes = @notes,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = @id
      `,
    ).run({
      id: input.id,
      className: input.className,
      subject: input.subject,
      currentUnit: input.currentUnit ?? null,
      teacherFocus: input.teacherFocus ?? null,
      testFormat: input.testFormat ?? null,
      testExamples: serializedTestExamples,
      keyConcepts: serializedKeyConcepts,
      notes: input.notes ?? null,
    });
  } else {
    const result = db.prepare(
      `
        INSERT INTO classes (
          owner_user_id,
          class_name,
          subject,
          current_unit,
          teacher_focus,
          test_format,
          test_examples,
          key_concepts,
          notes
        ) VALUES (
          @ownerUserId,
          @className,
          @subject,
          @currentUnit,
          @teacherFocus,
          @testFormat,
          @testExamples,
          @keyConcepts,
          @notes
        )
      `,
    ).run({
      ownerUserId: options.ownerUserId ?? null,
      className: input.className,
      subject: input.subject,
      currentUnit: input.currentUnit ?? null,
      teacherFocus: input.teacherFocus ?? null,
      testFormat: input.testFormat ?? null,
      testExamples: serializedTestExamples,
      keyConcepts: serializedKeyConcepts,
      notes: input.notes ?? null,
    });

    input.id = Number(result.lastInsertRowid);
  }

  // Re-read after write so callers always get the normalized DB shape back.
  const savedRow = db.prepare(
    `
      SELECT
        id,
        class_name,
        subject,
        current_unit,
        teacher_focus,
        test_format,
        test_examples,
        key_concepts,
        notes,
        created_at,
        updated_at
      FROM classes
      WHERE id = ?
    `,
  ).get(input.id) as ClassRow | undefined;

  if (!savedRow) {
    throw new Error("Failed to save class profile.");
  }

  return mapClassRow(savedRow);
}
