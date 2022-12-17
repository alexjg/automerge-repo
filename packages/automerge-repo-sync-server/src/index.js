import fs from "fs"
import express from "express"
import { WebSocketServer } from "ws"
import { Repo } from "automerge-repo"
import { NodeWSServerAdapter } from "automerge-repo-network-websocket"
import { NodeFSStorageAdapter } from "automerge-repo-storage-nodefs"
import { SqliteStorageAdapter } from "automerge-repo-storage-sqlite"
import {default as sqlite3} from "sqlite3"
import os from "os"

const dir = ".amrg"
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir)
}

var hostname = os.hostname()

const DB_FILE = "amrg.sqlite"
const TABLE_NAME = "documents"
const conn = new sqlite3.Database(TABLE_NAME, DB_FILE)
conn.run(`create table if not exists ${TABLE_NAME} (id text primary key, data blob)`)

// OH GOD
const updatingDocs = new Set()

conn.on("change", (evtType, database, table, rowid) => {
  conn.get(`select id from ${TABLE_NAME} where rowid = $rowid`, {$rowid: rowid}, (err, row) => {
    if (err != null) {
      console.log("error in change notificaiton: ", err)
      return 
    }
    console.log(row)
    const docId = row.id.split(".")[0]
    if (updatingDocs.has(docId)) {
        console.log("skipping update of ", docId)
        updatingDocs.delete(docId)
        return
    } else {
        updatingDocs.add(docId)
        const handle = serverRepo.find(docId)
        handle.emit("change", {handle})
    }
  })
})

const wsServer = new WebSocketServer({ noServer: true })
const config = {
  network: [new NodeWSServerAdapter(wsServer)],
  storage: new SqliteStorageAdapter(TABLE_NAME, conn),
  peerId: `storage-server-${hostname}`,
  sharePolicy: (peerId) => false,
}

const PORT = process.env.PORT !== undefined ? parseInt(process.env.PORT) : 3030
const serverRepo = new Repo(config)
const app = express()
app.use(express.static("public"))

app.get("/", (req, res) => {
  res.send("Hello World")
})

const server = app.listen(PORT, () => {
  console.log("Hello world")
  console.log(`Listening on port ${PORT}`)
})

server.on("upgrade", (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, (socket) => {
    wsServer.emit("connection", socket, request)
  })
})
