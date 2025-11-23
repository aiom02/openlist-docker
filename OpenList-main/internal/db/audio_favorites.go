package db

import (
	"github.com/OpenListTeam/OpenList/v4/internal/model"
	"github.com/pkg/errors"
)

// AudioFavoriteFolder operations

func ListAudioFavoriteFoldersByUser(userId uint) ([]model.AudioFavoriteFolder, error) {
	var folders []model.AudioFavoriteFolder
	if err := db.Where("user_id = ?", userId).Order("`order` ASC, created_at DESC").Find(&folders).Error; err != nil {
		return nil, errors.Wrapf(err, "failed to list audio favorite folders")
	}
	return folders, nil
}

func GetAudioFavoriteFolderById(id uint, userId uint) (*model.AudioFavoriteFolder, error) {
	var folder model.AudioFavoriteFolder
	if err := db.Where("id = ? AND user_id = ?", id, userId).First(&folder).Error; err != nil {
		return nil, errors.Wrapf(err, "failed to get audio favorite folder")
	}
	return &folder, nil
}

func CreateAudioFavoriteFolder(folder *model.AudioFavoriteFolder) error {
	return errors.WithStack(db.Create(folder).Error)
}

func UpdateAudioFavoriteFolder(folder *model.AudioFavoriteFolder) error {
	return errors.WithStack(db.Save(folder).Error)
}

func DeleteAudioFavoriteFolderById(id uint, userId uint) error {
	// Delete all favorites in this folder first
	if err := db.Where("folder_id = ? AND user_id = ?", id, userId).Delete(&model.AudioFavorite{}).Error; err != nil {
		return errors.Wrapf(err, "failed to delete favorites in folder")
	}
	
	// Then delete the folder
	result := db.Where("id = ? AND user_id = ?", id, userId).Delete(&model.AudioFavoriteFolder{})
	if result.Error != nil {
		return errors.Wrapf(result.Error, "failed to delete audio favorite folder")
	}
	if result.RowsAffected == 0 {
		return errors.New("audio favorite folder not found or not owned by user")
	}
	return nil
}

// AudioFavorite operations

func ListAudioFavoritesByFolder(folderId uint, userId uint) ([]model.AudioFavorite, error) {
	var favorites []model.AudioFavorite
	if err := db.Where("folder_id = ? AND user_id = ?", folderId, userId).Order("created_at DESC").Find(&favorites).Error; err != nil {
		return nil, errors.Wrapf(err, "failed to list audio favorites")
	}
	return favorites, nil
}

func ListAllAudioFavoritesByUser(userId uint) ([]model.AudioFavorite, error) {
	var favorites []model.AudioFavorite
	if err := db.Where("user_id = ?", userId).Order("created_at DESC").Find(&favorites).Error; err != nil {
		return nil, errors.Wrapf(err, "failed to list all audio favorites")
	}
	return favorites, nil
}

func GetAudioFavoriteById(id uint, userId uint) (*model.AudioFavorite, error) {
	var favorite model.AudioFavorite
	if err := db.Where("id = ? AND user_id = ?", id, userId).First(&favorite).Error; err != nil {
		return nil, errors.Wrapf(err, "failed to get audio favorite")
	}
	return &favorite, nil
}

func CheckAudioFavoriteExists(userId uint, folderId uint, originalPath string) (bool, error) {
	var count int64
	if err := db.Model(&model.AudioFavorite{}).Where("user_id = ? AND folder_id = ? AND original_path = ?", userId, folderId, originalPath).Count(&count).Error; err != nil {
		return false, errors.Wrapf(err, "failed to check audio favorite existence")
	}
	return count > 0, nil
}

func CreateAudioFavorite(favorite *model.AudioFavorite) error {
	return errors.WithStack(db.Create(favorite).Error)
}

func UpdateAudioFavorite(favorite *model.AudioFavorite) error {
	return errors.WithStack(db.Save(favorite).Error)
}

func DeleteAudioFavoriteById(id uint, userId uint) error {
	result := db.Where("id = ? AND user_id = ?", id, userId).Delete(&model.AudioFavorite{})
	if result.Error != nil {
		return errors.Wrapf(result.Error, "failed to delete audio favorite")
	}
	if result.RowsAffected == 0 {
		return errors.New("audio favorite not found or not owned by user")
	}
	return nil
}


