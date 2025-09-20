/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createTable("users", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    username: {
      // For reference, GitHub limits username to 39 characters.
      type: "varchar(30)",
      notNull: true,
      unique: true,
    },
    email: {
      // Why 254 in length? https://stackoverflow.com/a/1199238
      type: "varchar(254)",
      notNull: true,
      unique: true,
    },
    password: {
      // Why 60 in length? https://www.npmjs.com/package/bcrypt#hash-info
      type: "varchar(60)",
      notNull: true,
    },
    // Why timestamp with timezone? https://justatheory.com/2012/04/postgres-use-timestamptz/
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });
};

export const down = false;
