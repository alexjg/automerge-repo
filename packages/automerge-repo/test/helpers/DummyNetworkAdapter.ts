import EventEmitter from "eventemitter3"
import {
  NetworkAdapter,
  NetworkAdapterEvents,
} from "../../src/network/NetworkSubsystem"

export class DummyNetworkAdapter
  extends EventEmitter<NetworkAdapterEvents>
  implements NetworkAdapter
{
  connect(_: string) {}

  join(_: string) {}

  leave(_: string) {}
}
