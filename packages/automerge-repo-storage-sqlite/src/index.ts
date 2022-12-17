import {StorageAdapter} from "automerge-repo"
import {default as sqlite3} from "sqlite3"

console.log(sqlite3)

export class SqliteStorageAdapter implements StorageAdapter {
  conn: sqlite3.Database
  table_name: string

  constructor(table_name: string, db: sqlite3.Database) {
    this.table_name = table_name
    this.conn = db
  }

  load(docId: string): Promise<Uint8Array | null> {
    console.log("loading")
    return new Promise<Uint8Array | null>((resolve, reject) => {
      this.conn.get(`select data from ${this.table_name} where id = '${docId}';`, (err, row) => {
        if (err != null) {
          console.log("error loading: ", err)
          reject(err)
          return
        }
        if (row) {
          console.log("row: ", row)
          resolve(row.data)
        } else {
          resolve(null)
        }
      })
    })
  }

  save(docId: string, binary: Uint8Array): void {
    const query = `insert into documents (id, data) values ($docId, $binary)
      on conflict (id) do update set data = $binary
    `
    this.conn.run(query, {$docId: docId, $binary: Buffer.from(binary)}, (err: Error) => {
      if (err != null) {
        console.error(`error saving ${docId}: ${err}`)
      }
    })
  }

  remove(docId: string): void {
    this.conn.run(`delete from documents where id = ${docId}`, (_: any, err: Error) => {
      if (err != null) {
        console.error(`error removing ${docId}: ${err}`)
      }
    })
  }
}
