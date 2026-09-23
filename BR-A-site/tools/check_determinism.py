import hashlib
import subprocess
import sys

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

TARGET = (
        ROOT
        / "data"
        / "generated.json"
)

UPDATER = (
        ROOT
        / "tools"
        / "update_site.py"
)



def digest():

    return hashlib.sha256(
        TARGET.read_bytes()
    ).hexdigest()



subprocess.run(
    [
        sys.executable,
        str(UPDATER)
    ],
    check=True
)


run1 = digest()


subprocess.run(
    [
        sys.executable,
        str(UPDATER)
    ],
    check=True
)


run2 = digest()


print(
    "run1:",
    run1
)

print(
    "run2:",
    run2
)


if run1 == run2:

    print(
        "PASS"
    )

    raise SystemExit(0)


print(
    "FAIL"
)

raise SystemExit(1)