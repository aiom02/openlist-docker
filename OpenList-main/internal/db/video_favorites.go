package db

import (
	"github.com/OpenListTeam/OpenList/v4/internal/model"
	"github.com/pkg/errors"
)

// VideoFavoriteFolder operations

func ListVideoFavoriteFoldersByUser(userId uint) ([]model.VideoFavoriteFolder, error) {
	var folders []model.VideoFavoriteFolder
	if err := db.Where("user_id = ?", userId).Order("`order` ASC, created_at DESC").Find(&folders).Error; err != nil {
		return nil, errors.Wrapf(err, "failed to list video favorite folders")
	}
	return folders, nil
}

func GetVideoFavoriteFolderById(id uint, userId uint) (*model.VideoFavoriteFolder, error) {
	var folder model.VideoFavoriteFolder
	if err := db.Where("id = ? AND user_id = ?", id, userId).First(&folder).Error; err != nil {
		return nil, errors.Wrapf(err, "failed to get video favorite folder")
	}
	return &folder, nil
}

func CreateVideoFavoriteFolder(folder *model.VideoFavoriteFolder) error {
	return errors.WithStack(db.Create(folder).Error)
}

func UpdateVideoFavoriteFolder(folder *model.VideoFavoriteFolder) error {
	return errors.WithStack(db.Save(folder).Error)
}

func DeleteVideoFavoriteFolderById(id uint, userId uint) error {
	// Delete all favorites in this folder first
	if err := db.Where("folder_id = ? AND user_id = ?", id, userId).Delete(&model.VideoFavorite{}).Error; err != nil {
		return errors.Wrapf(err, "failed to delete favorites in folder")
	}

	// Then delete the folder
	result := db.Where("id = ? AND user_id = ?", id, userId).Delete(&model.VideoFavoriteFolder{})
	if result.Error != nil {
		return errors.Wrapf(result.Error, "failed to delete video favorite folder")
	}
	if result.RowsAffected == 0 {
		return errors.New("video favorite folder not found or not owned by user")
	}
	return nil
}

// VideoFavorite operations

func ListVideoFavoritesByFolder(folderId uint, userId uint) ([]model.VideoFavorite, error) {
	var favorites []model.VideoFavorite
	if err := db.Where("folder_id = ? AND user_id = ?", folderId, userId).Order("created_at DESC").Find(&favorites).Error; err != nil {
		return nil, errors.Wrapf(err, "failed to list video favorites")
	}
	return favorites, nil
}

func ListAllVideoFavoritesByUser(userId uint) ([]model.VideoFavorite, error) {
	var favorites []model.VideoFavorite
	if err := db.Where("user_id = ?", userId).Order("created_at DESC").Find(&favorites).Error; err != nil {
		return nil, errors.Wrapf(err, "failed to list all video favorites")
	}
	return favorites, nil
}

func GetVideoFavoriteById(id uint, userId uint) (*model.VideoFavorite, error) {
	var favorite model.VideoFavorite
	if err := db.Where("id = ? AND user_id = ?", id, userId).First(&favorite).Error; err != nil {
		return nil, errors.Wrapf(err, "failed to get video favorite")
	}
	return &favorite, nil
}

func CheckVideoFavoriteExists(userId uint, folderId uint, originalPath string) (bool, error) {
	var count int64
	if err := db.Model(&model.VideoFavorite{}).Where("user_id = ? AND folder_id = ? AND original_path = ?", userId, folderId, originalPath).Count(&count).Error; err != nil {
		return false, errors.Wrapf(err, "failed to check video favorite existence")
	}
	return count > 0, nil
}

func CreateVideoFavorite(favorite *model.VideoFavorite) error {
	return errors.WithStack(db.Create(favorite).Error)
}

func UpdateVideoFavorite(favorite *model.VideoFavorite) error {
	return errors.WithStack(db.Save(favorite).Error)
}

func DeleteVideoFavoriteById(id uint, userId uint) error {
	result := db.Where("id = ? AND user_id = ?", id, userId).Delete(&model.VideoFavorite{})
	if result.Error != nil {
		return errors.Wrapf(result.Error, "failed to delete video favorite")
	}
	if result.RowsAffected == 0 {
		return errors.New("video favorite not found or not owned by user")
	}
	return nil
}

