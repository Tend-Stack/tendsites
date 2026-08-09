"""Install the packaged TEND Sites extension in a disposable tend.host fixture.

Run this with tend.host's Python environment. The script changes only a temporary
data directory and never starts a panel, contacts a server, or uses live state.
"""

from __future__ import annotations

import argparse
import asyncio
import importlib
import sys
import tempfile
from pathlib import Path


def _arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host-root", type=Path, required=True)
    parser.add_argument("--archive", type=Path, required=True)
    return parser.parse_args()


async def _verify(host_root: Path, archive: Path) -> None:
    backend = host_root.resolve() / "backend"
    if not (backend / "app" / "services" / "extensions.py").is_file():
        raise RuntimeError("--host-root is not a compatible tend.host checkout")
    archive = archive.resolve()
    if not archive.is_file():
        raise RuntimeError("--archive does not exist")

    sys.path.insert(0, str(backend))
    from app.core import config
    from app.services import extensions as extension_service

    with tempfile.TemporaryDirectory(prefix="tendsites-host-fixture-") as temporary:
        data_directory = Path(temporary)
        config.settings.data_dir = data_directory
        extension_service = importlib.reload(extension_service)
        await extension_service.init_db()

        manifest = await extension_service.install_from_zip(archive.read_bytes())
        if manifest["id"] != "host.tend.sites" or manifest["schema"] != 2:
            raise RuntimeError("the installed package identity is not TEND Sites schema 2")
        installed = await extension_service.get_extension("host.tend.sites")
        if not installed or not installed["enabled"]:
            raise RuntimeError("the installed extension was not enabled")
        for relative_path in manifest["integrity"]:
            if not await extension_service.verify_runtime_integrity(
                "host.tend.sites", relative_path
            ):
                raise RuntimeError(f"runtime integrity failed for {relative_path}")

        await extension_service.storage_set(
            "host.tend.sites", "fixture", {"purpose": "cleanup-proof"}
        )
        if await extension_service.storage_get("host.tend.sites", "fixture") is None:
            raise RuntimeError("fixture storage was not written")
        if not await extension_service.uninstall("host.tend.sites"):
            raise RuntimeError("the installed extension was not removed")
        if await extension_service.get_extension("host.tend.sites") is not None:
            raise RuntimeError("the extension row survived uninstall")
        if await extension_service.storage_get("host.tend.sites", "fixture") is not None:
            raise RuntimeError("extension-scoped storage survived uninstall")
        if (data_directory / "extensions" / "host.tend.sites").exists():
            raise RuntimeError("the extension directory survived uninstall")


def main() -> None:
    arguments = _arguments()
    asyncio.run(_verify(arguments.host_root, arguments.archive))
    print("TEND Sites installed, verified, and cleaned up in an isolated tend.host fixture.")


if __name__ == "__main__":
    main()
