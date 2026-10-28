"""Refresh the portable example and downloadable skill kit from maintained sources."""
from pathlib import Path
import shutil
import zipfile
root=Path(__file__).resolve().parents[1]
shutil.copyfile(root/'content/pilot.json',root/'authoring-kit/example-course.json')
with zipfile.ZipFile(root/'public/authoring-kit.zip','w',zipfile.ZIP_DEFLATED) as archive:
    for item in sorted((root/'authoring-kit').rglob('*')):
        if item.is_file(): archive.write(item,item.relative_to(root/'authoring-kit'))
print('Refreshed authoring kit and current original example.')
