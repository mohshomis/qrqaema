import os
import shutil
import subprocess

def backup_settings():
    """Backup the current settings.py file"""
    if os.path.exists('backend/settings.py.bak'):
        os.remove('backend/settings.py.bak')
    shutil.copy('backend/backend/settings.py', 'backend/settings.py.bak')

def restore_settings():
    """Restore the original settings.py file"""
    if os.path.exists('backend/settings.py.bak'):
        shutil.copy('backend/settings.py.bak', 'backend/backend/settings.py')
        os.remove('backend/settings.py.bak')

def deploy_to_heroku():
    try:
        # Backup current settings
        print("Backing up current settings...")
        backup_settings()

        # Copy production settings
        print("Applying production settings...")
        shutil.copy('backend/deploymentsettings.py', 'backend/backend/settings.py')

        # Git add and commit
        print("Committing changes...")
        subprocess.run(['git', 'add', '.'], check=True)
        subprocess.run(['git', 'commit', '-m', 'Deploy to Heroku'], check=True)

        # Push to Heroku
        print("Pushing to Heroku...")
        subprocess.run(['git', 'push', 'heroku', 'main'], check=True)

        print("Deployment successful!")

    except subprocess.CalledProcessError as e:
        print(f"Deployment failed: {str(e)}")
    except Exception as e:
        print(f"An error occurred: {str(e)}")
    finally:
        # Restore local settings
        print("Restoring local settings...")
        restore_settings()

if __name__ == '__main__':
    deploy_to_heroku()
