package op

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/OpenListTeam/OpenList/v4/internal/db"
	"github.com/OpenListTeam/OpenList/v4/internal/driver"
	"github.com/OpenListTeam/OpenList/v4/internal/model"
	"github.com/OpenListTeam/OpenList/v4/pkg/utils"
	"github.com/pkg/errors"
)

// BuildMediaFingerprint creates a stable fingerprint for a media file
func BuildMediaFingerprint(storage driver.Driver, obj model.Obj) string {
	storageId := fmt.Sprintf("%d", storage.GetStorage().ID)
	
	// Try to get hash from object (prefer SHA256, then MD5, then SHA1)
	hashInfo := obj.GetHash()
	var hashValue string
	
	if sha256Hash := hashInfo.GetHash(utils.SHA256); sha256Hash != "" {
		hashValue = "sha256:" + sha256Hash
	} else if md5Hash := hashInfo.GetHash(utils.MD5); md5Hash != "" {
		hashValue = "md5:" + md5Hash
	} else if sha1Hash := hashInfo.GetHash(utils.SHA1); sha1Hash != "" {
		hashValue = "sha1:" + sha1Hash
	} else {
		// Fallback: use size + create time + object ID
		size := strconv.FormatInt(obj.GetSize(), 10)
		ctime := strconv.FormatInt(obj.CreateTime().Unix(), 10)
		objId := obj.GetID()
		hashValue = "fallback:" + size + "|" + ctime + "|" + objId
	}
	
	// Create final fingerprint by hashing storage_id + hash_value
	fingerprintSrc := storageId + "|" + hashValue
	hash := sha256.Sum256([]byte(fingerprintSrc))
	return fmt.Sprintf("%x", hash)
}

// MediaMarksListArgs represents the arguments for listing media marks
type MediaMarksListArgs struct{}

// MediaMarksCreateArgs represents the arguments for creating a media mark
type MediaMarksCreateArgs struct {
	TimeSecond float64 `json:"time_second"`
	Title      string  `json:"title"`
	Content    string  `json:"content"`
}

// MediaMarksUpdateArgs represents the arguments for updating a media mark
type MediaMarksUpdateArgs struct {
	ID         uint    `json:"id"`
	TimeSecond float64 `json:"time_second"`
	Title      string  `json:"title"`
	Content    string  `json:"content"`
}

// MediaMarksDeleteArgs represents the arguments for deleting a media mark
type MediaMarksDeleteArgs struct {
	ID uint `json:"id"`
}

// HandleMediaMarksList handles the media_marks_list method
func HandleMediaMarksList(ctx context.Context, storage driver.Driver, obj model.Obj, user *model.User) (interface{}, error) {
	if user.IsGuest() {
		return []model.MediaMarkDTO{}, nil // Return empty list for guest users
	}
	
	fingerprint := BuildMediaFingerprint(storage, obj)
	marks, err := db.ListMediaMarksByUserAndFingerprint(user.ID, fingerprint)
	if err != nil {
		return nil, errors.WithMessage(err, "failed to list media marks")
	}
	
	// Convert to DTOs
	result := make([]model.MediaMarkDTO, len(marks))
	for i, mark := range marks {
		result[i] = mark.ToDTO()
	}
	
	return result, nil
}

// HandleMediaMarksCreate handles the media_marks_create method
func HandleMediaMarksCreate(ctx context.Context, storage driver.Driver, obj model.Obj, user *model.User, data interface{}) (interface{}, error) {
	if user.IsGuest() || user.Disabled {
		return nil, errors.New("permission denied: only logged-in users can create media marks")
	}
	
	// Parse arguments
	var args MediaMarksCreateArgs
	if data != nil {
		dataBytes, err := json.Marshal(data)
		if err != nil {
			return nil, errors.WithMessage(err, "failed to marshal data")
		}
		if err := json.Unmarshal(dataBytes, &args); err != nil {
			return nil, errors.WithMessage(err, "failed to parse create arguments")
		}
	}
	
	fingerprint := BuildMediaFingerprint(storage, obj)
	
	mark := &model.MediaMark{
		UserId:       user.ID,
		Fingerprint:  fingerprint,
		StorageId:    storage.GetStorage().ID,
		OriginalPath: obj.GetPath(),
		TimeSecond:   args.TimeSecond,
		Title:        args.Title,
		Content:      args.Content,
	}
	
	if err := db.CreateMediaMark(mark); err != nil {
		return nil, errors.WithMessage(err, "failed to create media mark")
	}
	
	return mark.ToDTO(), nil
}

// HandleMediaMarksUpdate handles the media_marks_update method
func HandleMediaMarksUpdate(ctx context.Context, storage driver.Driver, obj model.Obj, user *model.User, data interface{}) (interface{}, error) {
	if user.IsGuest() || user.Disabled {
		return nil, errors.New("permission denied: only logged-in users can update media marks")
	}
	
	// Parse arguments
	var args MediaMarksUpdateArgs
	if data != nil {
		dataBytes, err := json.Marshal(data)
		if err != nil {
			return nil, errors.WithMessage(err, "failed to marshal data")
		}
		if err := json.Unmarshal(dataBytes, &args); err != nil {
			return nil, errors.WithMessage(err, "failed to parse update arguments")
		}
	}
	
	// Get existing mark and verify ownership
	existingMark, err := db.GetMediaMarkByIdAndUser(args.ID, user.ID)
	if err != nil {
		return nil, errors.WithMessage(err, "media mark not found or not owned by user")
	}
	
	// Verify fingerprint matches current file (optional security check)
	currentFingerprint := BuildMediaFingerprint(storage, obj)
	if existingMark.Fingerprint != currentFingerprint {
		return nil, errors.New("media mark fingerprint mismatch")
	}
	
	// Update fields
	existingMark.TimeSecond = args.TimeSecond
	existingMark.Title = args.Title
	existingMark.Content = args.Content
	
	if err := db.UpdateMediaMark(existingMark); err != nil {
		return nil, errors.WithMessage(err, "failed to update media mark")
	}
	
	return existingMark.ToDTO(), nil
}

// HandleMediaMarksDelete handles the media_marks_delete method
func HandleMediaMarksDelete(ctx context.Context, storage driver.Driver, obj model.Obj, user *model.User, data interface{}) (interface{}, error) {
	if user.IsGuest() || user.Disabled {
		return nil, errors.New("permission denied: only logged-in users can delete media marks")
	}
	
	// Parse arguments
	var args MediaMarksDeleteArgs
	if data != nil {
		dataBytes, err := json.Marshal(data)
		if err != nil {
			return nil, errors.WithMessage(err, "failed to marshal data")
		}
		if err := json.Unmarshal(dataBytes, &args); err != nil {
			return nil, errors.WithMessage(err, "failed to parse delete arguments")
		}
	}
	
	if err := db.DeleteMediaMarkByIdAndUser(args.ID, user.ID); err != nil {
		return nil, errors.WithMessage(err, "failed to delete media mark")
	}
	
	return map[string]interface{}{"success": true}, nil
}
